/**
 * High-Performance Bulk Import & Validation Engine
 * Universal PLM Platform - Section F: Enterprise Management (F06)
 */

import type { CustomFieldDefinition } from '../types/custom-fields.js';
import { validateCustomFields } from '../types/custom-fields.js';
import type { AutoNumberScheme } from '../types/numbering-scheme.js';
import { generateNextNumber } from '../types/numbering-scheme.js';

export interface RowValidationError {
  rowNumber: number;
  column?: string;
  message: string;
}

export interface BulkImportResult<T = any> {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: RowValidationError[];
  validRecords: T[];
}

/**
 * Parses raw CSV content into records and validates them against core PLM rules
 * and tenant dynamic custom field definitions.
 */
export function parseAndValidateCsv(
  csvContent: string,
  entityType: 'PART' | 'BOM_LINE',
  customFields: CustomFieldDefinition[] = [],
  options?: {
    tenantId?: string;
    autoNumberScheme?: AutoNumberScheme;
  }
): BulkImportResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [{ rowNumber: 1, message: 'CSV file must contain a header row and at least one data row.' }],
      validRecords: [],
    };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const headers = rawHeaders.map((h) => h.toLowerCase());

  const errors: RowValidationError[] = [];
  const validRecords: any[] = [];
  let currentScheme = options?.autoNumberScheme;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-indexed row number in the file
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length !== headers.length) {
      errors.push({
        rowNumber: rowNum,
        message: `Column count mismatch: expected ${headers.length} columns, found ${cols.length}.`,
      });
      continue;
    }

    const rowObj: Record<string, any> = {};
    const customFieldObj: Record<string, any> = {};

    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx];
      // Check if this header maps to a custom field
      const matchingField = customFields.find((f) => f.name.toLowerCase() === h);
      if (matchingField) {
        customFieldObj[matchingField.name] = cols[idx];
      }
    });

    // Validate based on entity type
    if (entityType === 'PART') {
      let partNumber = rowObj['partnumber'] || rowObj['part_number'] || rowObj['number'];
      const partName = rowObj['name'] || rowObj['title'] || rowObj['description'];
      const partType = (rowObj['type'] || 'COMPONENT').toUpperCase();
      const uom = (rowObj['uom'] || 'EA').toUpperCase();

      if (!partNumber && currentScheme) {
        // Auto-assign part number
        const gen = generateNextNumber(currentScheme);
        partNumber = gen.generatedNumber;
        currentScheme = gen.updatedScheme;
      }

      if (!partNumber) {
        errors.push({
          rowNumber: rowNum,
          column: 'partNumber',
          message: 'Missing required Part Number and no auto-numbering scheme was provided.',
        });
      }

      if (!partName) {
        errors.push({
          rowNumber: rowNum,
          column: 'name',
          message: 'Missing required Part Name.',
        });
      }

      // Dynamic custom fields validation
      const customValidation = validateCustomFields(customFields, customFieldObj);
      if (!customValidation.isValid) {
        customValidation.errors.forEach((err) => {
          errors.push({
            rowNumber: rowNum,
            column: err.fieldName,
            message: err.message,
          });
        });
      }

      if (partNumber && partName && customValidation.isValid) {
        validRecords.push({
          tenantId: options?.tenantId || 'tenant_default',
          partNumber,
          name: partName,
          type: partType,
          uom,
          customFields: customFieldObj,
        });
      }
    } else if (entityType === 'BOM_LINE') {
      const parentId = rowObj['parentpartid'] || rowObj['parent_id'];
      const compId = rowObj['componentpartid'] || rowObj['component_id'];
      const qtyStr = rowObj['quantity'] || rowObj['qty'];
      const qty = Number(qtyStr);

      if (!parentId) {
        errors.push({
          rowNumber: rowNum,
          column: 'parentPartId',
          message: 'Missing required Parent Part ID.',
        });
      }

      if (!compId) {
        errors.push({
          rowNumber: rowNum,
          column: 'componentPartId',
          message: 'Missing required Component Part ID.',
        });
      }

      if (isNaN(qty) || qty <= 0) {
        errors.push({
          rowNumber: rowNum,
          column: 'quantity',
          message: `Quantity must be a positive number. Received: "${qtyStr}".`,
        });
      }

      if (parentId && compId && !isNaN(qty) && qty > 0) {
        validRecords.push({
          tenantId: options?.tenantId || 'tenant_default',
          parentPartId: parentId,
          componentPartId: compId,
          quantity: qty,
          findNumber: Number(rowObj['findnumber'] || rowObj['item_num']) || 10,
        });
      }
    }
  }

  const failedRows = new Set(errors.map((e) => e.rowNumber)).size;

  return {
    totalRows: lines.length - 1,
    successfulRows: validRecords.length,
    failedRows,
    errors,
    validRecords,
  };
}
