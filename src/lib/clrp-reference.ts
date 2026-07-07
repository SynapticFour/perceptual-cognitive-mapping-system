/**
 * Cognitive Landscape Research Programme (CLRP) conformance reference for exports.
 * Update when pinning a new CLRP release. Normative text: CLRP repository + Zenodo DOI.
 */
export const CLRP_REFERENCE = {
  programme: 'CLRP',
  clrpRelease: 'clrp-v2026.1',
  clrpDoi: '10.5281/zenodo.21236100',
  clrpConceptDoi: '10.5281/zenodo.21236099',
  clrpRepository: 'https://github.com/SynapticFour/cognitive-landscape-research-programme',
  clrpDocuments: [
    { id: 'CLRP-003', version: '0.1.0', status: 'Draft' },
    { id: 'CLRP-005', version: '0.1.0', status: 'Draft' },
    { id: 'CLRP-007', version: '0.1.0', status: 'Proposed' },
  ],
} as const;

export type ClrpExportReference = typeof CLRP_REFERENCE;
