import descriptorsPack from '../../../content/atlas/descriptors-v1.json';

export type AtlasDescriptor = (typeof descriptorsPack.descriptors)[number];

export const ATLAS_DESCRIPTOR_VERSION = descriptorsPack.version;

/** Loaded descriptor cards (ATLAS v1; not scored — ADR-003). */
export const ATLAS_DESCRIPTORS: AtlasDescriptor[] = descriptorsPack.descriptors;
