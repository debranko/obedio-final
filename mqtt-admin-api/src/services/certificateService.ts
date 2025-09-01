import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface CertificateGenerationRequest {
  commonName: string;
  certificateType: 'ca' | 'server' | 'client';
  deviceType?: 'button' | 'watch' | 'sensor' | 'gateway' | 'admin' | 'service';
  deviceId?: string;
  organization?: string;
  organizationUnit?: string;
  locality?: string;
  state?: string;
  country?: string;
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  subjectAltNames?: string[];
  validityDays?: number;
  keySize?: number;
}

export interface CertificateInfo {
  id: number;
  certificateId: string;
  commonName: string;
  certificateType: string;
  deviceType?: string;
  deviceId?: string;
  organization: string;
  serialNumber: string;
  fingerprint: string;
  issuedAt: Date;
  expiresAt: Date;
  status: string;
  certificatePath: string;
  privateKeyPath?: string;
  chainPath?: string;
  bundlePath?: string;
}

export class CertificateService {
  private readonly certsDir: string;
  private readonly scriptsDir: string;

  constructor() {
    this.certsDir = path.join(process.cwd(), '..', 'docker', 'certificates');
    this.scriptsDir = path.join(process.cwd(), '..', 'scripts');
  }

  /**
   * Generate a new certificate using the shell scripts
   */
  async generateCertificate(request: CertificateGenerationRequest): Promise<CertificateInfo> {
    const certificateId = crypto.randomUUID();
    
    try {
      // Log the certificate generation request
      await this.logCertificateAction(certificateId, 'generation_requested', 'Certificate generation requested', {
        request: JSON.stringify(request)
      });

      let scriptPath: string;
      let scriptArgs: string[] = [];

      switch (request.certificateType) {
        case 'ca':
          scriptPath = path.join(this.scriptsDir, 'generate-ca.sh');
          break;
        
        case 'server':
          scriptPath = path.join(this.scriptsDir, 'generate-server-cert.sh');
          break;
        
        case 'client':
          if (!request.deviceId) {
            throw new Error('Device ID is required for client certificates');
          }
          scriptPath = path.join(this.scriptsDir, 'generate-client-cert.sh');
          scriptArgs = [
            request.deviceId,
            request.deviceType || 'device',
            request.organization || 'OBEDIO'
          ];
          break;
        
        default:
          throw new Error(`Unsupported certificate type: ${request.certificateType}`);
      }

      // Execute the certificate generation script
      logger.info(`Executing certificate generation script: ${scriptPath}`, { args: scriptArgs });
      
      const scriptCommand = `"${scriptPath}" ${scriptArgs.join(' ')}`;
      const result = execSync(scriptCommand, {
        cwd: this.scriptsDir,
        encoding: 'utf8',
        timeout: 30000, // 30 seconds timeout
      });

      logger.info('Certificate generation script completed', { output: result });

      // Extract certificate information
      const certInfo = await this.extractCertificateInfo(request, certificateId);

      // Store certificate information in database
      const dbCertificate = await prisma.mqttCertificate.create({
        data: {
          certificateId,
          commonName: request.commonName,
          certificateType: request.certificateType,
          deviceType: request.deviceType,
          deviceId: request.deviceId,
          organization: request.organization || 'OBEDIO',
          organizationUnit: request.organizationUnit,
          locality: request.locality,
          state: request.state,
          country: request.country || 'US',
          keyUsage: JSON.stringify(request.keyUsage || ['digitalSignature', 'keyEncipherment']),
          extendedKeyUsage: JSON.stringify(request.extendedKeyUsage || ['clientAuth']),
          subjectAltNames: request.subjectAltNames ? JSON.stringify(request.subjectAltNames) : null,
          serialNumber: certInfo.serialNumber,
          fingerprint: certInfo.fingerprint,
          issuerFingerprint: certInfo.issuerFingerprint,
          keySize: request.keySize || 2048,
          signatureAlgorithm: 'SHA256withRSA',
          issuedAt: certInfo.issuedAt,
          expiresAt: certInfo.expiresAt,
          status: 'active',
          certificatePath: certInfo.certificatePath,
          privateKeyPath: certInfo.privateKeyPath,
          chainPath: certInfo.chainPath,
          bundlePath: certInfo.bundlePath,
          metadata: JSON.stringify({
            generatedBy: 'certificate-service',
            scriptUsed: path.basename(scriptPath),
            generationTime: new Date().toISOString()
          })
        }
      });

      // Log successful generation
      await this.logCertificateAction(certificateId, 'generated', 'Certificate generated successfully', {
        certificateId: dbCertificate.certificateId,
        serialNumber: certInfo.serialNumber,
        fingerprint: certInfo.fingerprint
      });

      return {
        id: dbCertificate.id,
        certificateId: dbCertificate.certificateId,
        commonName: dbCertificate.commonName,
        certificateType: dbCertificate.certificateType,
        deviceType: dbCertificate.deviceType || undefined,
        deviceId: dbCertificate.deviceId || undefined,
        organization: dbCertificate.organization,
        serialNumber: dbCertificate.serialNumber,
        fingerprint: dbCertificate.fingerprint,
        issuedAt: dbCertificate.issuedAt,
        expiresAt: dbCertificate.expiresAt,
        status: dbCertificate.status,
        certificatePath: dbCertificate.certificatePath,
        privateKeyPath: dbCertificate.privateKeyPath || undefined,
        chainPath: dbCertificate.chainPath || undefined,
        bundlePath: dbCertificate.bundlePath || undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Certificate generation failed', { error: errorMessage, request });

      // Log failed generation
      await this.logCertificateAction(certificateId, 'generation_failed', `Certificate generation failed: ${errorMessage}`, {
        error: errorMessage,
        request: JSON.stringify(request)
      });

      throw new Error(`Certificate generation failed: ${errorMessage}`);
    }
  }

  /**
   * Extract certificate information from generated files
   */
  private async extractCertificateInfo(request: CertificateGenerationRequest, certificateId: string): Promise<{
    serialNumber: string;
    fingerprint: string;
    issuerFingerprint?: string;
    issuedAt: Date;
    expiresAt: Date;
    certificatePath: string;
    privateKeyPath?: string;
    chainPath?: string;
    bundlePath?: string;
  }> {
    let certPath: string;
    let keyPath: string | undefined;
    let chainPath: string | undefined;
    let bundlePath: string | undefined;

    // Determine file paths based on certificate type
    switch (request.certificateType) {
      case 'ca':
        certPath = path.join(this.certsDir, 'ca', 'ca.crt');
        keyPath = path.join(this.certsDir, 'ca', 'ca.key');
        break;
      
      case 'server':
        certPath = path.join(this.certsDir, 'server.crt');
        keyPath = path.join(this.certsDir, 'server.key');
        chainPath = path.join(this.certsDir, 'server-chain.crt');
        break;
      
      case 'client':
        if (!request.deviceId) {
          throw new Error('Device ID is required for client certificates');
        }
        const clientDir = path.join(this.certsDir, 'clients', request.deviceId);
        certPath = path.join(clientDir, `${request.deviceId}.crt`);
        keyPath = path.join(clientDir, `${request.deviceId}.key`);
        chainPath = path.join(clientDir, `${request.deviceId}-chain.crt`);
        bundlePath = path.join(clientDir, `${request.deviceId}-bundle.pem`);
        break;
      
      default:
        throw new Error(`Unsupported certificate type: ${request.certificateType}`);
    }

    // Check if certificate file exists
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }

    // Extract certificate information using OpenSSL
    try {
      // Get serial number
      const serialCmd = `openssl x509 -in "${certPath}" -noout -serial`;
      const serialOutput = execSync(serialCmd, { encoding: 'utf8' });
      const serialNumber = serialOutput.replace('serial=', '').trim();

      // Get fingerprint
      const fingerprintCmd = `openssl x509 -in "${certPath}" -fingerprint -sha256 -noout`;
      const fingerprintOutput = execSync(fingerprintCmd, { encoding: 'utf8' });
      const fingerprint = fingerprintOutput.split('=')[1].trim();

      // Get validity dates
      const datesCmd = `openssl x509 -in "${certPath}" -noout -dates`;
      const datesOutput = execSync(datesCmd, { encoding: 'utf8' });
      
      const notBeforeMatch = datesOutput.match(/notBefore=(.+)/);
      const notAfterMatch = datesOutput.match(/notAfter=(.+)/);
      
      if (!notBeforeMatch || !notAfterMatch) {
        throw new Error('Could not extract certificate validity dates');
      }

      const issuedAt = new Date(notBeforeMatch[1]);
      const expiresAt = new Date(notAfterMatch[1]);

      // Get issuer fingerprint for non-CA certificates
      let issuerFingerprint: string | undefined;
      if (request.certificateType !== 'ca') {
        const caPath = path.join(this.certsDir, 'ca', 'ca.crt');
        if (fs.existsSync(caPath)) {
          const issuerFingerprintCmd = `openssl x509 -in "${caPath}" -fingerprint -sha256 -noout`;
          const issuerFingerprintOutput = execSync(issuerFingerprintCmd, { encoding: 'utf8' });
          issuerFingerprint = issuerFingerprintOutput.split('=')[1].trim();
        }
      }

      return {
        serialNumber,
        fingerprint,
        issuerFingerprint,
        issuedAt,
        expiresAt,
        certificatePath: certPath,
        privateKeyPath: keyPath,
        chainPath: chainPath && fs.existsSync(chainPath) ? chainPath : undefined,
        bundlePath: bundlePath && fs.existsSync(bundlePath) ? bundlePath : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract certificate information: ${errorMessage}`);
    }
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId: string): Promise<CertificateInfo | null> {
    const certificate = await prisma.mqttCertificate.findUnique({
      where: { certificateId }
    });

    if (!certificate) {
      return null;
    }

    return this.mapDbCertificateToInfo(certificate);
  }

  /**
   * List certificates with optional filtering
   */
  async listCertificates(options: {
    certificateType?: string;
    deviceType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    certificates: CertificateInfo[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { certificateType, deviceType, status, page = 1, limit = 10 } = options;

    const where: any = {};
    if (certificateType) where.certificateType = certificateType;
    if (deviceType) where.deviceType = deviceType;
    if (status) where.status = status;

    const [certificates, total] = await Promise.all([
      prisma.mqttCertificate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mqttCertificate.count({ where })
    ]);

    return {
      certificates: certificates.map(cert => this.mapDbCertificateToInfo(cert)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(certificateId: string, reason?: string): Promise<void> {
    const certificate = await prisma.mqttCertificate.findUnique({
      where: { certificateId }
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    if (certificate.status !== 'active') {
      throw new Error('Certificate is not active');
    }

    // Update certificate status
    await prisma.mqttCertificate.update({
      where: { certificateId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: reason
      }
    });

    // Log revocation
    await this.logCertificateAction(certificateId, 'revoked', `Certificate revoked: ${reason || 'No reason provided'}`, {
      reason,
      revokedAt: new Date().toISOString()
    });

    logger.info('Certificate revoked', { certificateId, reason });
  }

  /**
   * Check for expiring certificates
   */
  async getExpiringCertificates(days: number = 30): Promise<CertificateInfo[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + days);

    const certificates = await prisma.mqttCertificate.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lte: expiryThreshold
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    return certificates.map(cert => this.mapDbCertificateToInfo(cert));
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStatistics(): Promise<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
    expiringSoon: number;
    byType: Record<string, number>;
    byDeviceType: Record<string, number>;
  }> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      total,
      active,
      revoked,
      expired,
      expiringSoon,
      byType,
      byDeviceType
    ] = await Promise.all([
      prisma.mqttCertificate.count(),
      prisma.mqttCertificate.count({ where: { status: 'active' } }),
      prisma.mqttCertificate.count({ where: { status: 'revoked' } }),
      prisma.mqttCertificate.count({ where: { expiresAt: { lt: now } } }),
      prisma.mqttCertificate.count({
        where: {
          status: 'active',
          expiresAt: { lte: thirtyDaysFromNow, gte: now }
        }
      }),
      prisma.mqttCertificate.groupBy({
        by: ['certificateType'],
        _count: { _all: true }
      }),
      prisma.mqttCertificate.groupBy({
        by: ['deviceType'],
        _count: { _all: true },
        where: { deviceType: { not: null } }
      })
    ]);

    return {
      total,
      active,
      revoked,
      expired,
      expiringSoon,
      byType: Object.fromEntries(byType.map(item => [item.certificateType, item._count._all])),
      byDeviceType: Object.fromEntries(byDeviceType.map(item => [item.deviceType!, item._count._all]))
    };
  }

  /**
   * Log certificate action
   */
  private async logCertificateAction(
    certificateId: string,
    action: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.mqttCertificateLog.create({
        data: {
          certificateId: parseInt(certificateId.toString()),
          action,
          details: message,
          metadata: metadata ? JSON.stringify(metadata) : null,
          // TODO: Add user tracking when authentication is implemented
          // performedBy: userId,
          // ipAddress: req.ip,
          // userAgent: req.get('User-Agent')
        }
      });
    } catch (error) {
      logger.error('Failed to log certificate action', { error, certificateId, action });
    }
  }

  /**
   * Map database certificate to CertificateInfo
   */
  private mapDbCertificateToInfo(certificate: any): CertificateInfo {
    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      commonName: certificate.commonName,
      certificateType: certificate.certificateType,
      deviceType: certificate.deviceType || undefined,
      deviceId: certificate.deviceId || undefined,
      organization: certificate.organization,
      serialNumber: certificate.serialNumber,
      fingerprint: certificate.fingerprint,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      status: certificate.status,
      certificatePath: certificate.certificatePath,
      privateKeyPath: certificate.privateKeyPath || undefined,
      chainPath: certificate.chainPath || undefined,
      bundlePath: certificate.bundlePath || undefined
    };
  }
}

export const certificateService = new CertificateService();