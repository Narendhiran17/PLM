/**
 * Sourcing, AML (Approved Manufacturer List) & AVL (Approved Vendor List)
 * Universal PLM Platform - Section C: Manufacturing & Supply Chain (C04, C05, C06)
 */

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  code: string; // e.g. "SUP-ARROW", "SUP-AVNET", "SUP-HARMONIC"
  country: string;
  status: 'QUALIFIED' | 'PROBATIONARY' | 'DISQUALIFIED';
  rating: number; // 1 to 5 stars
  contactEmail: string;
  paymentTerms: string;
}

export interface ManufacturerPart {
  id: string;
  tenantId: string;
  manufacturerName: string; // e.g. "Harmonic Drive LLC", "Texas Instruments", "Vishay"
  mpn: string; // Manufacturer Part Number, e.g. "CSG-20-100-2UH", "OPA2197IDR"
  description: string;
  datasheetUrl?: string;
  rohsStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'EXEMPT';
  lifecycleStatus: 'ACTIVE' | 'NOT_RECOMMENDED' | 'END_OF_LIFE' | 'OBSOLETE';
}

export interface AmlEntry {
  id: string;
  tenantId: string;
  internalPartId: string; // Points to our internal Part Number (e.g. ELC-0052)
  manufacturerPartId: string;
  preference: 'PREFERRED' | 'APPROVED' | 'DO_NOT_USE';
  qualificationStatus: 'QUALIFIED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
}

export interface AvlEntry {
  id: string;
  tenantId: string;
  internalPartId: string;
  supplierId: string; // Distributor/vendor, e.g. Digi-Key, Mouser, Arrow
  manufacturerPartId: string;
  vendorPartNumber: string;
  unitPrice: number;
  minimumOrderQty: number; // MOQ
  leadTimeDays: number;
  preference: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  isContractedPrice: boolean;
}

export interface OptimalSourcingDecision {
  internalPartId: string;
  selectedSupplierId: string;
  selectedMpn: string;
  unitPrice: number;
  leadTimeDays: number;
  moq: number;
  preference: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  qualificationStatus: string;
}

/**
 * Selects the optimal qualified supplier and manufacturer part based on preference,
 * lead time, and contracted price.
 */
export function selectOptimalSupplier(
  internalPartId: string,
  amlList: AmlEntry[],
  avlList: AvlEntry[],
  mpnMap: Map<string, ManufacturerPart>
): OptimalSourcingDecision | null {
  // 1. Filter qualified and approved AML entries
  const approvedAmlIds = new Set(
    amlList
      .filter(
        (a) =>
          a.internalPartId === internalPartId &&
          a.preference !== 'DO_NOT_USE' &&
          a.qualificationStatus === 'QUALIFIED'
      )
      .map((a) => a.manufacturerPartId)
  );

  if (approvedAmlIds.size === 0) {
    return null; // No approved manufacturer available
  }

  // 2. Filter AVL entries that map to an approved manufacturer
  const eligibleAvl = avlList.filter(
    (avl) =>
      avl.internalPartId === internalPartId &&
      approvedAmlIds.has(avl.manufacturerPartId)
  );

  if (eligibleAvl.length === 0) {
    return null;
  }

  // 3. Sort by: Primary > Secondary > Backup, then lowest unit price
  const preferenceRank = { PRIMARY: 1, SECONDARY: 2, BACKUP: 3 };

  eligibleAvl.sort((a, b) => {
    const rankDiff = preferenceRank[a.preference] - preferenceRank[b.preference];
    if (rankDiff !== 0) return rankDiff;
    return a.unitPrice - b.unitPrice;
  });

  const best = eligibleAvl[0];
  const mpnObj = mpnMap.get(best.manufacturerPartId);

  return {
    internalPartId,
    selectedSupplierId: best.supplierId,
    selectedMpn: mpnObj ? mpnObj.mpn : best.vendorPartNumber,
    unitPrice: best.unitPrice,
    leadTimeDays: best.leadTimeDays,
    moq: best.minimumOrderQty,
    preference: best.preference,
    qualificationStatus: 'QUALIFIED',
  };
}
