import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/middleware/errorHandler';
import { ProvisioningService } from '@/services/provisioningService';
import {
  CreateProvisionTokenSchema,
  ProvisionRequestSchema,
  QRCodeRequestSchema,
  PaginationSchema,
  createValidationMiddleware
} from '@/schemas';
import { logOperation } from '@/utils/logger';

const router = Router();

// POST /api/v1/provision/request - Device provisioning request
router.post('/request',
  createValidationMiddleware(ProvisionRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const provisionRequest = req.body;
    
    const result = await ProvisioningService.provisionDevice(provisionRequest);
    
    if (!result.success) {
      throw new ValidationError(result.error || 'Provisioning failed');
    }
    
    logOperation('device_provision_request', {
      deviceId: provisionRequest.deviceId,
      token: provisionRequest.token,
    });
    
    res.status(201).json(createSuccessResponse({
      deviceId: provisionRequest.deviceId,
      status: 'provisioned',
      credentials: result.deviceCredentials,
    }, 'Device provisioned successfully'));
  })
);

// GET /api/v1/provision/tokens - List provision tokens
router.get('/tokens',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    const tokens = await ProvisioningService.getActiveTokens();
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTokens = tokens.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedTokens, 'Provision tokens retrieved');
    response.pagination = {
      page,
      limit,
      total: tokens.length,
      pages: Math.ceil(tokens.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/provision/tokens - Create provision token
router.post('/tokens',
  createValidationMiddleware(CreateProvisionTokenSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const tokenParams = req.body;
    
    const result = await ProvisioningService.createProvisionToken(tokenParams);
    
    logOperation('provision_token_created', {
      tokenId: result.token.id,
      site: tokenParams.site,
      room: tokenParams.room,
      deviceType: tokenParams.deviceType,
    });
    
    res.status(201).json(createSuccessResponse({
      token: result.token,
      qrCode: result.qrCode,
    }, 'Provision token created successfully'));
  })
);

// GET /api/v1/provision/tokens/:token - Get provision token details
router.get('/tokens/:token', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
  
  const tokenData = await ProvisioningService.validateProvisionToken(token);
  
  if (!tokenData) {
    throw new NotFoundError('Provision token');
  }
  
  res.json(createSuccessResponse(tokenData, 'Provision token details retrieved'));
}));

// DELETE /api/v1/provision/tokens/:token - Revoke provision token
router.delete('/tokens/:token', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
  
  const success = await ProvisioningService.revokeToken(token);
  
  if (!success) {
    throw new NotFoundError('Provision token');
  }
  
  logOperation('provision_token_revoked', { token });
  
  res.json(createSuccessResponse(null, 'Provision token revoked successfully'));
}));

// POST /api/v1/provision/qr-code - Generate custom QR code
router.post('/qr-code',
  createValidationMiddleware(QRCodeRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { data, size, errorCorrectionLevel, margin, darkColor, lightColor } = req.body;
    
    // Use the QR code generation method directly
    const QRCode = require('qrcode');
    
    const qrOptions = {
      width: size,
      errorCorrectionLevel,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);
    
    res.json(createSuccessResponse({
      qrCode: qrCodeDataUrl,
      data,
      options: qrOptions,
    }, 'QR code generated successfully'));
  })
);

// GET /api/v1/provision/history - Provision history
router.get('/history',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    
    // In a real implementation, this would query a database for provision history
    // For now, return empty array as placeholder
    const history: any[] = [];
    
    const response = createSuccessResponse(history, 'Provision history retrieved');
    response.pagination = {
      page,
      limit,
      total: history.length,
      pages: Math.ceil(history.length / limit),
    };
    
    res.json(response);
  })
);

// POST /api/v1/provision/cleanup - Clean up expired tokens (maintenance endpoint)
router.post('/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const cleanedCount = await ProvisioningService.cleanupExpiredTokens();
  
  logOperation('provision_cleanup', { cleanedCount });
  
  res.json(createSuccessResponse({
    cleanedTokens: cleanedCount,
  }, 'Expired tokens cleaned up successfully'));
}));

// GET /api/v1/provision/validate/:token - Validate provision token
router.get('/validate/:token', asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
  
  const tokenData = await ProvisioningService.validateProvisionToken(token);
  
  const response = {
    valid: !!tokenData,
    token: tokenData,
  };
  
  res.json(createSuccessResponse(response, 'Token validation completed'));
}));

export default router;