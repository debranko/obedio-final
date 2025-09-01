import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/middleware/errorHandler';
import {
  CreateSecurityProfileSchema,
  UpdateSecurityProfileSchema,
  CreateACLRuleSchema,
  UpdateACLRuleSchema,
  CertificateRequestSchema,
  PaginationSchema,
  createValidationMiddleware
} from '@/schemas';
import { logOperation, securityLogger } from '@/utils/logger';
import { RedisService } from '@/utils/redis';
import crypto from 'crypto';

const router = Router();

// Security data storage (in production, this would be in a database)
const certificates = new Map<string, any>();
const aclRules = new Map<string, any>();
const securityProfiles = new Map<string, any>();

// Initialize default security profiles
securityProfiles.set('button_default', {
  id: 'button_default',
  name: 'Button Device Default',
  description: 'Default security profile for button devices',
  permissions: ['publish:status', 'publish:emergency', 'subscribe:command'],
  restrictions: {
    maxConnections: 1,
    allowedTopics: ['obedio/+/+/button/+/status', 'obedio/+/+/button/+/emergency'],
    rateLimit: {
      messagesPerSecond: 10,
      bytesPerSecond: 1024,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

securityProfiles.set('watch_default', {
  id: 'watch_default',
  name: 'Watch Device Default',
  description: 'Default security profile for watch devices',
  permissions: ['publish:status', 'publish:location', 'subscribe:command', 'subscribe:notification'],
  restrictions: {
    maxConnections: 1,
    allowedTopics: ['obedio/+/+/watch/+/status', 'obedio/+/+/watch/+/location'],
    rateLimit: {
      messagesPerSecond: 30,
      bytesPerSecond: 2048,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// GET /api/v1/security/certificates - List certificates
router.get('/certificates',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    const allCertificates = Array.from(certificates.values());
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCertificates = allCertificates.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedCertificates, 'Certificates retrieved successfully');
    response.pagination = {
      page,
      limit,
      total: allCertificates.length,
      pages: Math.ceil(allCertificates.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/security/certificates - Generate new certificate
router.post('/certificates',
  createValidationMiddleware(CertificateRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const certRequest = req.body;
    
    // Generate certificate ID
    const certId = crypto.randomUUID();
    
    // In a real implementation, this would generate actual X.509 certificates
    const certificate = {
      id: certId,
      commonName: certRequest.commonName,
      organization: certRequest.organization,
      organizationUnit: certRequest.organizationUnit,
      locality: certRequest.locality,
      state: certRequest.state,
      country: certRequest.country,
      validityDays: certRequest.validityDays,
      keyUsage: certRequest.keyUsage || ['digitalSignature', 'keyEncipherment'],
      extendedKeyUsage: certRequest.extendedKeyUsage || ['clientAuth'],
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + certRequest.validityDays * 24 * 60 * 60 * 1000),
      status: 'active',
      serialNumber: crypto.randomBytes(16).toString('hex'),
      fingerprint: crypto.randomBytes(20).toString('hex'),
      // In production, these would be actual PEM-encoded certificates
      publicKey: `-----BEGIN CERTIFICATE-----\n${crypto.randomBytes(256).toString('base64')}\n-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----\n${crypto.randomBytes(256).toString('base64')}\n-----END PRIVATE KEY-----`,
    };
    
    certificates.set(certId, certificate);
    
    logOperation('certificate_generated', {
      certId,
      commonName: certRequest.commonName,
      validityDays: certRequest.validityDays,
    });
    
    res.status(201).json(createSuccessResponse(certificate, 'Certificate generated successfully'));
  })
);

// GET /api/v1/security/certificates/:id - Get certificate details
router.get('/certificates/:id', asyncHandler(async (req: Request, res: Response) => {
  const certId = req.params.id;
  const certificate = certificates.get(certId);
  
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  // Don't return private key in GET requests
  const safeCertificate = {
    ...certificate,
    privateKey: undefined,
  };
  
  res.json(createSuccessResponse(safeCertificate, 'Certificate details retrieved'));
}));

// DELETE /api/v1/security/certificates/:id - Revoke certificate
router.delete('/certificates/:id', asyncHandler(async (req: Request, res: Response) => {
  const certId = req.params.id;
  const certificate = certificates.get(certId);
  
  if (!certificate) {
    throw new NotFoundError('Certificate');
  }
  
  // Mark as revoked instead of deleting
  certificate.status = 'revoked';
  certificate.revokedAt = new Date();
  
  logOperation('certificate_revoked', { certId });
  
  res.json(createSuccessResponse(null, 'Certificate revoked successfully'));
}));

// GET /api/v1/security/acl - Get ACL rules
router.get('/acl',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    const allRules = Array.from(aclRules.values());
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRules = allRules.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedRules, 'ACL rules retrieved successfully');
    response.pagination = {
      page,
      limit,
      total: allRules.length,
      pages: Math.ceil(allRules.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/security/acl - Create ACL rule
router.post('/acl',
  createValidationMiddleware(CreateACLRuleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const ruleData = req.body;
    
    // Check for duplicate rules
    const existingRule = Array.from(aclRules.values()).find((rule: any) =>
      rule.username === ruleData.username && rule.topic === ruleData.topic
    );
    
    if (existingRule) {
      throw new ValidationError('ACL rule already exists for this username and topic');
    }
    
    const ruleId = crypto.randomUUID();
    const aclRule = {
      id: ruleId,
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    aclRules.set(ruleId, aclRule);
    
    logOperation('acl_rule_created', {
      ruleId,
      username: ruleData.username,
      topic: ruleData.topic,
      access: ruleData.access,
    });
    
    res.status(201).json(createSuccessResponse(aclRule, 'ACL rule created successfully'));
  })
);

// GET /api/v1/security/acl/:id - Get ACL rule details
router.get('/acl/:id', asyncHandler(async (req: Request, res: Response) => {
  const ruleId = req.params.id;
  const aclRule = aclRules.get(ruleId);
  
  if (!aclRule) {
    throw new NotFoundError('ACL rule');
  }
  
  res.json(createSuccessResponse(aclRule, 'ACL rule details retrieved'));
}));

// PUT /api/v1/security/acl/:id - Update ACL rule
router.put('/acl/:id',
  createValidationMiddleware(UpdateACLRuleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const ruleId = req.params.id;
    const updateData = req.body;
    const aclRule = aclRules.get(ruleId);
    
    if (!aclRule) {
      throw new NotFoundError('ACL rule');
    }
    
    // Update rule
    Object.assign(aclRule, updateData, { updatedAt: new Date() });
    
    logOperation('acl_rule_updated', {
      ruleId,
      updatedFields: Object.keys(updateData),
    });
    
    res.json(createSuccessResponse(aclRule, 'ACL rule updated successfully'));
  })
);

// DELETE /api/v1/security/acl/:id - Delete ACL rule
router.delete('/acl/:id', asyncHandler(async (req: Request, res: Response) => {
  const ruleId = req.params.id;
  const aclRule = aclRules.get(ruleId);
  
  if (!aclRule) {
    throw new NotFoundError('ACL rule');
  }
  
  aclRules.delete(ruleId);
  
  logOperation('acl_rule_deleted', { ruleId });
  
  res.json(createSuccessResponse(null, 'ACL rule deleted successfully'));
}));

// GET /api/v1/security/profiles - List security profiles
router.get('/profiles',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    const allProfiles = Array.from(securityProfiles.values());
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfiles = allProfiles.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedProfiles, 'Security profiles retrieved successfully');
    response.pagination = {
      page,
      limit,
      total: allProfiles.length,
      pages: Math.ceil(allProfiles.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/security/profiles - Create security profile
router.post('/profiles',
  createValidationMiddleware(CreateSecurityProfileSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const profileData = req.body;
    
    // Check for duplicate profile names
    const existingProfile = Array.from(securityProfiles.values()).find((profile: any) =>
      profile.name === profileData.name
    );
    
    if (existingProfile) {
      throw new ValidationError('Security profile with this name already exists');
    }
    
    const profileId = crypto.randomUUID();
    const securityProfile = {
      id: profileId,
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    securityProfiles.set(profileId, securityProfile);
    
    logOperation('security_profile_created', {
      profileId,
      name: profileData.name,
      permissions: profileData.permissions,
    });
    
    res.status(201).json(createSuccessResponse(securityProfile, 'Security profile created successfully'));
  })
);

// GET /api/v1/security/profiles/:id - Get security profile details
router.get('/profiles/:id', asyncHandler(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const securityProfile = securityProfiles.get(profileId);
  
  if (!securityProfile) {
    throw new NotFoundError('Security profile');
  }
  
  res.json(createSuccessResponse(securityProfile, 'Security profile details retrieved'));
}));

// PUT /api/v1/security/profiles/:id - Update security profile
router.put('/profiles/:id',
  createValidationMiddleware(UpdateSecurityProfileSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.params.id;
    const updateData = req.body;
    const securityProfile = securityProfiles.get(profileId);
    
    if (!securityProfile) {
      throw new NotFoundError('Security profile');
    }
    
    // Update profile
    Object.assign(securityProfile, updateData, { updatedAt: new Date() });
    
    logOperation('security_profile_updated', {
      profileId,
      updatedFields: Object.keys(updateData),
    });
    
    res.json(createSuccessResponse(securityProfile, 'Security profile updated successfully'));
  })
);

// DELETE /api/v1/security/profiles/:id - Delete security profile
router.delete('/profiles/:id', asyncHandler(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const securityProfile = securityProfiles.get(profileId);
  
  if (!securityProfile) {
    throw new NotFoundError('Security profile');
  }
  
  // Check if profile is in use (in production, would check database)
  if (['button_default', 'watch_default'].includes(profileId)) {
    throw new ValidationError('Cannot delete default security profile');
  }
  
  securityProfiles.delete(profileId);
  
  logOperation('security_profile_deleted', { profileId });
  
  res.json(createSuccessResponse(null, 'Security profile deleted successfully'));
}));

// GET /api/v1/security/audit - Security audit log
router.get('/audit',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    // In production, this would query audit logs from database
    const auditLogs: any[] = [];
    
    const response = createSuccessResponse(auditLogs, 'Security audit logs retrieved');
    response.pagination = {
      page,
      limit,
      total: auditLogs.length,
      pages: Math.ceil(auditLogs.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/security/validate - Validate security configuration
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { username, topic, action } = req.body;
  
  // Find applicable ACL rules
  const applicableRules = Array.from(aclRules.values()).filter((rule: any) => {
    return rule.username === username || rule.username === '*';
  });
  
  // Check topic permissions
  let hasAccess = false;
  for (const rule of applicableRules) {
    const topicPattern = rule.topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*');
    const regex = new RegExp(`^${topicPattern}$`);
    
    if (regex.test(topic)) {
      if (rule.access === 'deny') {
        hasAccess = false;
        break;
      } else if (rule.access === action || rule.access === 'readwrite') {
        hasAccess = true;
      }
    }
  }
  
  const validationResult = {
    username,
    topic,
    action,
    hasAccess,
    applicableRules: applicableRules.length,
    timestamp: new Date().toISOString(),
  };
  
  res.json(createSuccessResponse(validationResult, 'Security validation completed'));
}));

export default router;