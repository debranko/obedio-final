# File Restoration Warning

## Rule: Always verify before overwriting files

When facing an issue with a specific component or file, **NEVER** assume that entire pages need to be recreated or overwritten. Instead:

1. **Analyze the current state**: Examine the current files and understand their structure before making changes
2. **Identify the specific issue**: Focus on fixing only the problematic component/file
3. **Consider using backups**: Use the existing backup files (.bak, .backup, .save) rather than creating new ones
4. **Document changes**: Always document what changes were made and why

## Preventing Accidental File Overwrites

- Always check if there are multiple versions of a file before determining which one to use
- Use diff tools to compare file versions to understand differences
- When a file has a suffix like `.broken`, `.bak`, `.save`, understand its purpose before using it
- Prefer targeted fixes through `apply_diff` rather than wholesale file replacement

## For Guest Detail Panel Issues

The file `guest-detail-panel.tsx` has several versions:
- `.broken` - Contains issues that needed fixing
- `.backup`/`.bak`/`.save` - Potential working versions for restoration
- The main file should not be overwritten without careful consideration

Remember: It's better to make minimal, targeted changes than to replace entire files.