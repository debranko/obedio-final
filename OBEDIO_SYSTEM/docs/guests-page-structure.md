# Guests Page Structure and Files

## Overview

The `/guests` page in the OBEDIO system allows managing yacht guests, displaying their details, and tracking their status. This page is critical for crew members to access guest information and preferences.

## File Structure Analysis

After careful examination, we've identified several important files for the guests functionality:

| File | Last Modified | Size | Purpose |
|------|---------------|------|---------|
| `page.tsx` | May 11, 2025 | 35,755 bytes | Main implementation of the guests page |
| `page.tsx.bak` | May 11, 2025 | 35,755 bytes | Backup of working implementation |
| `fixed-page.tsx` | May 10, 2025 | 35,755 bytes | Fixed implementation with corrections |
| `new-implementation.tsx` | May 10, 2025 | 44,997 bytes | Newer implementation with possibly more features, but contains syntax errors |
| `redesigned-page.tsx` | May 10, 2025 | 16,644 bytes | Earlier redesign attempt |
| `new-implementation.part1/2/3.tsx` | May 10, 2025 | Various | Split parts of the new implementation |

## Current Working Implementation

The current working implementation (`page.tsx`) features:
- Guest listing with filtering and search capabilities
- Guest details panel showing room information, preferences, and status
- VIP status indicators
- Arrival/departure information
- Food preferences and other special requirements

## Restoration Notes

When attempting to use the `new-implementation.tsx` version, we encountered a syntax error around line 1158:

```
Unexpected token `div`. Expected jsx identifier
```

This suggests the newer implementation has unclosed tags, functions, or other syntax issues that prevent it from compiling properly. The error occurred in the JSX return statement, which indicates a structural issue in the component.

## Recommended Approach for Future Changes

1. **Always test changes locally before deployment**
2. **Create proper backups before major changes**
3. **Use incremental changes rather than wholesale replacements**
4. **Document the purpose of different file versions**
5. **Consider using version control for tracking changes**

## Related Components

The guests page interacts with several key components:
- `components/guests/guest-detail-panel.tsx` - Shows detailed guest information
- `components/guests/upcoming-guests-section.tsx` - Displays upcoming guests
- `components/guests/change-cabin-modal.tsx` - Allows reassigning guests to different rooms

## API Integration

The page connects to the `/api/guests` endpoint which:
- Retrieves guest data from the database
- Includes service request information for each guest
- Transforms the data for frontend consumption

## Troubleshooting Guide

If issues occur with the guests page:

1. Check for syntax errors in the page implementation
2. Verify API responses from `/api/guests` endpoint
3. Examine component dependencies for potential conflicts
4. Consider reverting to a known working backup if necessary
5. Look for error logs in the browser console or server output