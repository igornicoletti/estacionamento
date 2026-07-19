export { getProfileInitials, ProfileFormCard, ProfilePhotoDialog } from "./components"
export { useMyProfile } from "./hooks/use-my-profile"
export { myProfileCopy } from "./my-profile-copy"
export { MyProfileRoute } from "./routes/my-profile-route"
export { ProfileLegacyRedirectRoute } from "./routes/profile-legacy-redirect-route"
export {
  ProfileServiceError,
  updateCurrentProfile,
  uploadProfileAvatarFile,
  validateAvatarFile
} from "./services"
export type {
  MyProfileSnapshot,
  ProfileAccountStatus,
  ProfileSummary,
  ProfileUpdateInput
} from "./types/profile-types"
export {
  mapAuthProfileToProfileSummary,
  resolveDisplayValue,
  resolveProfileCpf,
  resolveProfileEmail,
  resolveProfilePhone,
  resolveProfileRole
} from "./utils/profile-models"
