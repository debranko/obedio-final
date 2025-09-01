import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/middleware/errorHandler';
import {
  CertificateRequestSchema,
  PaginationSchema,
  createValidationMiddleware
} from '@/schemas';
import { logOperation, securityLogger } from '@/utils/logger';
import { certificateService, CertificateGenerationRequest } from '@/services/certificateService';

const router = Router();

// GET /api/v1/certificates - List certificates
router.get('/',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, certificateType, deviceType, status } = req.query as any;
    
    const result = await certificateService.listCertificates({
      certificateType,
      deviceType,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const response = createSuccessResponse(result.certificates, 'Certificates retrieved successfully');
    response.pagination = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
    };
    
    res.json(response);
  })
);

// POST /api/v1/certificates/ca - Generate CA certificate
router.post('/ca',
  asyncHandler(async (req: Request, res: Response) => {
    const request: CertificateGenerationRequest = {
      commonName: 'OBEDIO Root CA',
      certificateType: 'ca',
      organization: 'OBEDIO',
      country: 'US',
      keyUsage: ['digitalSignature', 'cRLSign', 'keyCertSign'],
      extendedKeyUsage: ['serverAuth', 'clientAuth'],
      validityDays: 3650, // 10 years
      keySize: 4096
    };
    
    try {
      const certificate = await certificateService.generateCertificate(request);
      
      logOperation('ca_certificate_generated', {
        certificateId: certificate.certificateId,
        serialNumber: certificate.serialNumber,
        expiresAt: certificate.expiresAt
      });
      
      res.status(201).json(createSuccessResponse(certificate, 'CA certificate generated successfully'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logOperation('ca_certificate_generation_failed', { error: errorMessage });
      throw new ValidationError(`CA certificate generation failed: ${errorMessage}`);
    }
  })
);

// POST /api/v1/certificates/server - Generate server certificate
router.post('/server',
  asyncHandler(async (req: Request, res: Response) => {
    const { commonName = 'mosquitto.obedio.local', validityDays = 730 } = req.body;
    
    const request: CertificateGenerationRequest = {
      commonName,
      certificateType: 'server',
      organization: 'OBEDIO',
      country: 'US',
      keyUsage: ['digitalSignature', 'keyEncipherment'],
      extendedKeyUsage: ['serverAuth'],
      subjectAltNames: [
        'DNS:mosquitto',
        'DNS:mosquitto.obedio.local',
        'DNS:localhost',
        'DNS:obedio-mosquitto',
        'DNS:mqtt.obedio.local',
        'IP:127.0.0.1',
        'IP:::1'
      ],
      validityDays,
      keySize: 2048
    };
    
    try {
      const certificate = await certificateService.generateCertificate(request);
      
      logOperation('server_certificate_generated', {
        certificateId: certificate.certificateId,
        commonName: certificate.commonName,
        serialNumber: certificate.serialNumber,
        expiresAt: certificate.expiresAt
      });
      
      res.status(201).json(createSuccessResponse(certificate, 'Server certificate generated successfully'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logOperation('server_certificate_generation_failed', { error: errorMessage });
      throw new ValidationError(`Server certificate generation failed: ${errorMessage}`);
    }
  })
);

// POST /api/v1/certificates/client - Generate client certificate
router.post('/client',
  createValidationMiddleware(CertificateRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId, deviceType = 'device', organization = 'OBEDIO', validityDays = 365 } = req.body;
    
    if (!deviceId) {
      throw new ValidationError('Device ID is required for client certificates');
    }
    
    const request: CertificateGenerationRequest = {
      commonName: `${deviceType}-${deviceId}`,
      certificateType: 'client',
      deviceType,
      deviceId,
      organization,
      country: 'US',
      keyUsage: ['digitalSignature', 'keyAgreement'],
      extendedKeyUsage: ['clientAuth'],
      subjectAltNames: [
        `DNS:${deviceId}`,
        `DNS:${deviceId}.obedio.local`,
        `DNS:${deviceType}-${deviceId}`,
        `DNS:${deviceType}-${deviceId}.obedio.local`,
        `URI:urn:obedio:device:${deviceType}:${deviceId}`
      ],
      validityDays,
      keySize: 2048
    };
    
    try {
      const certificate = await certificateService.generateCertificate(request);
      
      logOperation('client_certificate_generated', {
        certificateId: certificate.certificateId,
        deviceId,
        deviceType,
        commonName: certificate.commonName,
        serialNumber: certificate.serialNumber,
        expiresAt: certificate.expiresAt
      });
      
      res.status(201).json(createSuccessResponse(certificate, 'Client certificate generated successfully'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logOperation('client_certificate_generation_failed', { 
        error: errorMessage, 
        deviceId, 
        deviceType 
      });
      throw new ValidationError(`Client certificate generation failed: ${errorMessage}`);
    }
  })
);

// GET /api/v1/certificates/:id - Get certificate details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const certificateId = req.params.id;
  const certificate = await certificateService.getCertificateById(certificateId);
  
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  res.json(createSuccessResponse(certificate, 'Certificate details retrieved'));
}));

// DELETE /api/v1/certificates/:id/revoke - Revoke certificate
router.delete('/:id/revoke', asyncHandler(async (req: Request, res: Response) => {
  const certificateId = req.params.id;
  const { reason } = req.body;
  
  const certificate = await certificateService.getCertificateById(certificateId);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  try {
    await certificateService.revokeCertificate(certificateId, reason);
    
    logOperation('certificate_revoked', {
      certificateId,
      commonName: certificate.commonName,
      reason: reason || 'No reason provided'
    });
    
    res.json(createSuccessResponse(null, 'Certificate revoked successfully'));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logOperation('certificate_revocation_failed', { 
      error: errorMessage, 
      certificateId 
    });
    throw new ValidationError(`Certificate revocation failed: ${errorMessage}`);
  }
}));

// GET /api/v1/certificates/:id/download - Download certificate files
router.get('/:id/download', asyncHandler(async (req: Request, res: Response) => {
  const certificateId = req.params.id;
  const { format = 'pem', includePrivateKey = false } = req.query;
  
  const certificate = await certificateService.getCertificateById(certificateId);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  // Security check: only allow private key download for client certificates
  if (includePrivateKey === 'true' && certificate.certificateType !== 'client') {
    throw new ValidationError('Private key download is only allowed for client certificates');
  }
  
  try {
    // For now, return the certificate information
    // In a full implementation, this would stream the actual certificate files
    const downloadInfo = {
      certificateId: certificate.certificateId,
      commonName: certificate.commonName,
      certificateType: certificate.certificateType,
      format,
      files: {
        certificate: certificate.certificatePath,
        ...(includePrivateKey === 'true' && certificate.privateKeyPath && {
          privateKey: certificate.privateKeyPath
        }),
        ...(certificate.chainPath && {
          chain: certificate.chainPath
        }),
        ...(certificate.bundlePath && {
          bundle: certificate.bundlePath
        })
      }
    };
    
    logOperation('certificate_downloaded', {
      certificateId,
      format,
      includePrivateKey: includePrivateKey === 'true',
      commonName: certificate.commonName
    });
    
    res.json(createSuccessResponse(downloadInfo, 'Certificate download information retrieved'));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logOperation('certificate_download_failed', { 
      error: errorMessage, 
      certificateId 
    });
    throw new ValidationError(`Certificate download failed: ${errorMessage}`);
  }
}));

// GET /api/v1/certificates/expiring - Get expiring certificates
router.get('/expiring/list', asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  
  const expiringCertificates = await certificateService.getExpiringCertificates(parseInt(days as string));
  
  res.json(createSuccessResponse(expiringCertificates, `Certificates expiring in ${days} days retrieved`));
}));

// GET /api/v1/certificates/statistics - Get certificate statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const statistics = await certificateService.getCertificateStatistics();
  
  res.json(createSuccessResponse(statistics, 'Certificate statistics retrieved'));
}));

// POST /api/v1/certificates/validate - Validate certificate configuration
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.body;
  
  if (!certificateId) {
    throw new ValidationError('Certificate ID is required');
  }
  
  const certificate = await certificateService.getCertificateById(certificateId);
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  // Basic validation checks
  const now = new Date();
  const validationResult = {
    certificateId: certificate.certificateId,
    commonName: certificate.commonName,
    certificateType: certificate.certificateType,
    status: certificate.status,
    isValid: certificate.status === 'active',
    isExpired: certificate.expiresAt < now,
    expiresAt: certificate.expiresAt,
    daysUntilExpiry: Math.ceil((certificate.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    issues: [] as string[]
  };
  
  // Check for issues
  if (certificate.status !== 'active') {
    validationResult.issues.push(`Certificate status is ${certificate.status}`);
  }
  
  if (certificate.expiresAt < now) {
    validationResult.issues.push('Certificate has expired');
  } else if (certificate.expiresAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
    validationResult.issues.push('Certificate expires within 30 days');
  }
  
  validationResult.isValid = validationResult.issues.length === 0;
  
  logOperation('certificate_validated', {
    certificateId,
    isValid: validationResult.isValid,
    issues: validationResult.issues
  });
  
  res.json(createSuccessResponse(validationResult, 'Certificate validation completed'));
}));

export default router;