import type { AppLanguage } from "@/lib/settings/preferences-storage";

export type TranslationKey =
  | "common.loading"
  | "common.signOut"
  | "navigation.dashboard"
  | "navigation.projects"
  | "navigation.tasks"
  | "navigation.contacts"
  | "navigation.suppliers"
  | "navigation.documents"
  | "navigation.mail"
  | "navigation.notes"
  | "navigation.nomenclature"
  | "navigation.settings"
  | "navigation.newProject"
  | "navigation.project"
  | "navigation.appName"
  | "settings.profile.label"
  | "settings.profile.description"
  | "settings.profile.pageDescription"
  | "settings.workspace.label"
  | "settings.workspace.description"
  | "settings.workspace.pageDescription"
  | "settings.team.label"
  | "settings.team.description"
  | "settings.team.pageDescription"
  | "settings.preferences.label"
  | "settings.preferences.description"
  | "settings.preferences.pageDescription"
  | "quickActions.createProject"
  | "quickActions.createContact"
  | "quickActions.uploadDocument"
  | "quickActions.createSupplier"
  | "dashboard.recentProjects"
  | "dashboard.viewAll"
  | "dashboard.upcomingTasks"
  | "dashboard.note"
  | "dashboard.quickActions"
  | "profile.firstName"
  | "profile.lastName"
  | "profile.email"
  | "profile.profession"
  | "profile.phone"
  | "profile.detailsPlaceholder"
  | "profile.manage"
  | "workspace.name"
  | "workspace.generalEmail"
  | "workspace.invitedCollaborators"
  | "workspace.noInvites"
  | "workspace.manage"
  | "team.manage"
  | "search.open"
  | "search.trigger"
  | "search.triggerLong"
  | "search.dialogTitle"
  | "search.dialogDescription"
  | "search.placeholder"
  | "search.running"
  | "search.error"
  | "search.projects"
  | "search.projectCodes"
  | "search.contacts"
  | "search.suppliers"
  | "search.documents"
  | "search.tags"
  | "search.nomenclature"
  | "search.quickActions"
  | "search.recent"
  | "search.navigation"
  | "notes.loading"
  | "notes.add"
  | "notes.noContent"
  | "notes.retry"
  | "notes.emptyTitle"
  | "notes.deleteTitle"
  | "notes.deleteDescription"
  | "notes.cancel"
  | "notes.deleting"
  | "notes.delete"
  | "notes.deletedToast"
  | "notes.savedToast"
  | "notes.saveError"
  | "notes.optionalTitle"
  | "notes.write"
  | "notes.saving"
  | "notes.send"
  | "team.membersTitle"
  | "team.membersDescription"
  | "team.loading"
  | "team.notActiveTitle"
  | "team.notActiveDescription"
  | "team.roleOwner"
  | "team.roleMember"
  | "team.inviteHint"
  | "team.inviteeEmail"
  | "team.sending"
  | "team.inviteByEmail"
  | "team.invitationSent"
  | "team.invitationSaved"
  | "team.invitationLinkCopied"
  | "team.invitationLinkReady"
  | "team.invitationEmailFailed"
  | "team.copyInviteLink"
  | "common.cancel"
  | "common.delete"
  | "common.deleting"
  | "common.saving"
  | "common.creating"
  | "common.saveChanges"
  | "common.close"
  | "common.workspaceNotFound"
  | "contacts.addTitle"
  | "contacts.editTitle"
  | "contacts.deleteTitle"
  | "contacts.deleteDescription"
  | "contacts.deletedToast"
  | "contacts.nameRequired"
  | "contacts.createdToast"
  | "contacts.updatedToast"
  | "suppliers.addTitle"
  | "suppliers.editTitle"
  | "suppliers.deleteTitle"
  | "suppliers.deleteDescription"
  | "suppliers.deletedToast"
  | "suppliers.companyRequired"
  | "suppliers.createdToast"
  | "suppliers.updatedToast"
  | "suppliers.inMaterialLibrary"
  | "suppliers.inMaterialLibraryHint"
  | "suppliers.filterAllSamples"
  | "suppliers.filterSamplesInLibrary"
  | "suppliers.filterSamplesNotInLibrary"
  | "suppliers.materialLibraryBadge"
  | "nomenclature.addTitle"
  | "nomenclature.editTitle"
  | "nomenclature.addDescription"
  | "nomenclature.editDescription"
  | "nomenclature.deleteTitle"
  | "nomenclature.deleteDescription"
  | "nomenclature.deletedToast"
  | "nomenclature.titleRequired"
  | "nomenclature.createdToast"
  | "nomenclature.updatedToast"
  | "nomenclature.saveError"
  | "notes.addTitle"
  | "notes.editTitle"
  | "notes.addDescription"
  | "notes.editDescription"
  | "notes.contentRequired"
  | "notes.createdToast"
  | "notes.updatedToast"
  | "documents.emptyTitle"
  | "documents.emptySearchTitle"
  | "documents.loading"
  | "documents.uploadTitle"
  | "documents.uploadDescription"
  | "documents.uploadedToast"
  | "documents.dropzoneHint"
  | "documents.dropzoneActive"
  | "documents.dropzoneAllowed"
  | "documents.uploadFailed"
  | "documents.deleteTitle"
  | "documents.deleteDescription"
  | "documents.deletedToast"
  | "elaborati.uploadTitle"
  | "elaborati.uploadDescription"
  | "elaborati.dropOnProject"
  | "elaborati.uploadedToast"
  | "elaborati.deleteTitle"
  | "elaborati.deleteDescription"
  | "elaborati.deletedToast"
  | "contacts.loading"
  | "contacts.emptyTitle"
  | "contacts.emptySearchTitle"
  | "suppliers.loading"
  | "suppliers.emptyTitle"
  | "suppliers.emptySearchTitle"
  | "common.retry"
  | "common.saved"
  | "common.uploading"
  | "common.change"
  | "common.remove"
  | "common.logo"
  | "common.upload"
  | "common.notAuthenticated"
  | "settings.preferences.generalTitle"
  | "settings.preferences.generalDescription"
  | "settings.preferences.saved"
  | "settings.preferences.languageLabel"
  | "settings.preferences.themeLabel"
  | "settings.preferences.behavior"
  | "settings.preferences.behaviorDescription"
  | "settings.preferences.openDashboardOnStartup"
  | "settings.preferences.openDashboardOnStartupDescription"
  | "settings.preferences.enableProjectNotifications"
  | "settings.preferences.enableProjectNotificationsDescription"
  | "settings.preferences.managePreferences"
  | "settings.profile.loading"
  | "settings.profile.sectionTitle"
  | "settings.profile.photoLabel"
  | "settings.profile.photoHint"
  | "settings.profile.firstNameRequired"
  | "settings.profile.emailInvalid"
  | "settings.profile.phoneInvalid"
  | "settings.profile.emailConfirm"
  | "settings.profile.updated"
  | "settings.profile.photoUpdated"
  | "settings.profile.photoRemoved"
  | "settings.profile.photoRemoveFailed"
  | "settings.profile.role"
  | "settings.profile.roleHint"
  | "settings.profile.bio"
  | "settings.profile.bioPlaceholder"
  | "settings.workspace.loading"
  | "settings.workspace.sectionTitle"
  | "settings.workspace.logoLabel"
  | "settings.workspace.logoHint"
  | "settings.workspace.nameRequired"
  | "settings.workspace.emailInvalid"
  | "settings.workspace.phoneInvalid"
  | "settings.workspace.websiteInvalid"
  | "settings.workspace.updated"
  | "settings.workspace.logoUpdated"
  | "settings.workspace.logoRemoved"
  | "settings.workspace.logoRemoveFailed"
  | "settings.workspace.code"
  | "settings.workspace.codeHint"
  | "settings.workspace.address"
  | "settings.workspace.city"
  | "settings.workspace.country"
  | "settings.workspace.postalCode"
  | "settings.workspace.website"
  | "settings.workspace.websitePlaceholder"
  | "settings.security.changePassword"
  | "settings.security.changePasswordDescription"
  | "settings.security.newPassword"
  | "settings.security.confirmPassword"
  | "settings.security.passwordMinLength"
  | "settings.security.passwordMismatch"
  | "settings.security.updating"
  | "settings.security.updatePassword"
  | "settings.security.passwordUpdated"
  | "settings.security.activeSessions"
  | "settings.security.activeSessionsDescription"
  | "settings.security.loadingSession"
  | "settings.security.thisDevice"
  | "settings.security.currentSession"
  | "settings.security.lastSignIn"
  | "settings.security.lastSignInUnknown"
  | "settings.security.logoutCurrent"
  | "settings.security.logoutAll"
  | "settings.security.sendPasswordReset"
  | "settings.security.sendingPasswordReset"
  | "settings.security.passwordResetSent"
  | "settings.security.passwordResetHint"
  | "settings.security.resetPasswordPageDescription"
  | "settings.security.deleteAccount"
  | "settings.security.deleteAccountDescription"
  | "settings.security.deleteAccountConfirmTitle"
  | "settings.security.deleteAccountConfirmDescriptionOwner"
  | "settings.security.deleteAccountConfirmDescriptionMember"
  | "settings.security.deleteAccountConfirm"
  | "settings.security.deletingAccount"
  | "settings.security.accountDeleted"
  | "nomenclature.loading"
  | "nomenclature.loadError"
  | "nomenclature.noNotes"
  | "nomenclature.deleteAria"
  | "tasks.noTasks"
  | "tasks.addTask"
  | "tasks.noTasksSearch"
  | "tasks.clearSearch"
  | "tasks.viewTasks"
  | "tasks.markComplete"
  | "tasks.markIncomplete"
  | "tasks.notePrefix"
  | "tasks.urgencyLow"
  | "tasks.urgencyMedium"
  | "tasks.urgencyHigh"
  | "projects.statusActive"
  | "projects.statusOnHold"
  | "projects.statusCompleted"
  | "projects.statusArchived"
  | "projects.activityTitle"
  | "navigation.sidebarAria"
  | "navigation.more"
  | "navigation.moreDescription"
  | "navigation.bottomNavAria"
  | "navigation.menu"
  | "activity.noRecent"
  | "activity.today"
  | "ai.commandOrNavigate"
  | "ai.placeholder"
  | "ai.commandAria"
  | "ai.branding"
  | "ai.suggestedCommands"
  | "auth.signIn"
  | "auth.signInDescription"
  | "auth.signingIn"
  | "auth.password"
  | "auth.noAccount"
  | "auth.createOne"
  | "auth.emailPlaceholder"
  | "auth.authCallbackFailed"
  | "auth.emailLinkExpired"
  | "auth.workspaceSetupFailed"
  | "auth.emailNotFound"
  | "auth.emailNotConfirmed"
  | "auth.invalidCredentials"
  | "auth.signUp"
  | "auth.signUpDescription"
  | "auth.signingUp"
  | "auth.fullName"
  | "auth.fullNamePlaceholder"
  | "auth.confirmPassword"
  | "auth.passwordMismatch"
  | "auth.passwordMinLength"
  | "auth.alreadyHaveAccount"
  | "auth.signInLink"
  | "auth.accountCreated"
  | "auth.checkEmail";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    "common.loading": "Loading...",
    "common.signOut": "Sign out",
    "navigation.dashboard": "Dashboard",
    "navigation.projects": "Projects",
    "navigation.tasks": "Tasks",
    "navigation.contacts": "Contacts",
    "navigation.suppliers": "Suppliers",
    "navigation.documents": "Studio documents",
    "navigation.mail": "Mail",
    "navigation.notes": "Notes",
    "navigation.nomenclature": "Nomenclature",
    "navigation.settings": "Settings",
    "navigation.newProject": "New project",
    "navigation.project": "Project",
    "navigation.appName": "Archiviio",
    "settings.profile.label": "Profile",
    "settings.profile.description": "Your personal account",
    "settings.profile.pageDescription": "Manage your personal account details.",
    "settings.workspace.label": "Workspace",
    "settings.workspace.description": "Studio details",
    "settings.workspace.pageDescription": "Manage your studio workspace.",
    "settings.team.label": "Team",
    "settings.team.description": "Members and access",
    "settings.team.pageDescription": "Collaborate with your studio team.",
    "settings.preferences.label": "Preferences",
    "settings.preferences.description": "Language, appearance, and security",
    "settings.preferences.pageDescription":
      "Customize language, appearance, behavior, and security.",
    "quickActions.createProject": "Create project",
    "quickActions.createContact": "Create contact",
    "quickActions.uploadDocument": "Upload deliverable",
    "quickActions.createSupplier": "Add supplier",
    "dashboard.recentProjects": "Recent projects",
    "dashboard.viewAll": "View all",
    "dashboard.upcomingTasks": "Upcoming tasks",
    "dashboard.note": "Note",
    "dashboard.quickActions": "Quick actions",
    "profile.firstName": "First name",
    "profile.lastName": "Last name",
    "profile.email": "Email",
    "profile.profession": "Profession",
    "profile.phone": "Phone number",
    "profile.detailsPlaceholder": "Profile details will appear here.",
    "profile.manage": "Manage profile",
    "workspace.name": "Studio name",
    "workspace.generalEmail": "General email",
    "workspace.invitedCollaborators": "Invited collaborators",
    "workspace.noInvites": "No invited collaborators yet.",
    "workspace.manage": "Manage workspace",
    "team.manage": "Manage team",
    "search.open": "Open search",
    "search.trigger": "Search",
    "search.triggerLong": "Search projects, contacts, studio documents...",
    "search.dialogTitle": "Search",
    "search.dialogDescription":
      "Search projects, contacts, studio documents and more in Archiviio",
    "search.placeholder": "Search by name...",
    "search.running": "Searching...",
    "search.error": "Search error. Try again.",
    "search.projects": "Projects",
    "search.projectCodes": "Project codes",
    "search.contacts": "Contacts",
    "search.suppliers": "Suppliers",
    "search.documents": "Studio documents",
    "search.tags": "Tags",
    "search.nomenclature": "Nomenclature",
    "search.quickActions": "Quick actions",
    "search.recent": "Recent searches",
    "search.navigation": "Navigation",
    "notes.loading": "Loading notes...",
    "notes.add": "Add note",
    "notes.noContent": "No content yet",
    "notes.retry": "Retry",
    "notes.emptyTitle": "No notes yet",
    "notes.deleteTitle": "Delete note",
    "notes.deleteDescription":
      "Delete \"{title}\"? This action cannot be undone.",
    "notes.cancel": "Cancel",
    "notes.deleting": "Deleting...",
    "notes.delete": "Delete",
    "notes.deletedToast": "\"{title}\" deleted",
    "notes.savedToast": "Note saved",
    "notes.saveError": "Failed to save note",
    "notes.optionalTitle": "Optional title",
    "notes.write": "Write a note...",
    "notes.saving": "Saving...",
    "notes.send": "Send",
    "team.membersTitle": "Team members",
    "team.membersDescription": "Invite colleagues to share projects and tasks.",
    "team.loading": "Loading team...",
    "team.notActiveTitle": "Team collaboration is not active yet",
    "team.notActiveDescription":
      "When multi-user workspaces launch, you will be able to invite colleagues and manage roles here.",
    "team.roleOwner": "Owner",
    "team.roleMember": "Member",
    "team.inviteHint": "Send an email invitation to join your workspace.",
    "team.inviteeEmail": "Invitee email",
    "team.sending": "Sending...",
    "team.inviteByEmail": "Invite by email",
    "team.invitationSent": "Invitation sent to {email}",
    "team.invitationSaved": "Invitation saved for {email}",
    "team.invitationLinkCopied":
      "Invitation link copied for {email}. Share it with your colleague.",
    "team.invitationLinkReady":
      "Invitation created for {email}. Copy the link below and send it to your colleague.",
    "team.invitationEmailFailed":
      "Invitation saved for {email}, but the email could not be sent: {error}",
    "team.copyInviteLink": "Copy link",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.deleting": "Deleting...",
    "common.saving": "Saving...",
    "common.creating": "Creating...",
    "common.saveChanges": "Save changes",
    "common.close": "Close",
    "common.workspaceNotFound": "Workspace not found",
    "contacts.addTitle": "Add contact",
    "contacts.editTitle": "Edit contact",
    "contacts.deleteTitle": "Delete contact",
    "contacts.deleteDescription":
      "Delete {name}? This action cannot be undone.",
    "contacts.deletedToast": "{name} deleted",
    "contacts.nameRequired": "Name is required.",
    "contacts.createdToast": "Contact created",
    "contacts.updatedToast": "Contact updated",
    "suppliers.addTitle": "Add supplier",
    "suppliers.editTitle": "Edit supplier",
    "suppliers.deleteTitle": "Delete supplier",
    "suppliers.deleteDescription":
      "Delete {name}? This action cannot be undone.",
    "suppliers.deletedToast": "{name} deleted",
    "suppliers.companyRequired": "Company is required.",
    "suppliers.createdToast": "Supplier created",
    "suppliers.updatedToast": "Supplier updated",
    "suppliers.inMaterialLibrary": "Samples in material library",
    "suppliers.inMaterialLibraryHint":
      "Enable if you keep physical samples from this supplier in the studio.",
    "suppliers.filterAllSamples": "All sample availability",
    "suppliers.filterSamplesInLibrary": "Samples in library",
    "suppliers.filterSamplesNotInLibrary": "No samples in library",
    "suppliers.materialLibraryBadge": "In library",
    "nomenclature.addTitle": "Add rule",
    "nomenclature.editTitle": "Edit rule",
    "nomenclature.addDescription":
      "Add a title and notes describing how to name files or projects.",
    "nomenclature.editDescription":
      "Update the title and notes for this naming rule.",
    "nomenclature.deleteTitle": "Delete rule",
    "nomenclature.deleteDescription":
      "Delete \"{name}\"? This action cannot be undone.",
    "nomenclature.deletedToast": "\"{name}\" deleted",
    "nomenclature.titleRequired": "Title is required.",
    "nomenclature.createdToast": "Rule created",
    "nomenclature.updatedToast": "Rule updated",
    "nomenclature.saveError": "Failed to save rule",
    "notes.addTitle": "Add note",
    "notes.editTitle": "Edit note",
    "notes.addDescription":
      "Capture a quick thought or reminder for your workspace.",
    "notes.editDescription": "Update the title and content for this note.",
    "notes.contentRequired": "Add a title or some content.",
    "notes.createdToast": "Note created",
    "notes.updatedToast": "Note updated",
    "documents.emptyTitle": "No studio documents yet",
    "documents.emptySearchTitle": "No studio documents match your search",
    "documents.loading": "Loading studio documents...",
    "documents.uploadTitle": "Upload studio document",
    "documents.uploadDescription":
      "Upload contracts, schedules, and other studio files not tied to a project.",
    "documents.uploadedToast": "{name} uploaded",
    "documents.dropzoneHint": "Drag files here or click to upload",
    "documents.dropzoneActive": "Drop files to upload",
    "documents.dropzoneAllowed": "{types} · max {size} per file",
    "documents.uploadFailed": "Failed",
    "documents.deleteTitle": "Delete studio document",
    "documents.deleteDescription":
      "Delete {name}? This removes the file and all stored versions. This action cannot be undone.",
    "documents.deletedToast": "{name} deleted",
    "elaborati.uploadTitle": "Upload deliverable",
    "elaborati.uploadDescription":
      "Choose a project or drag files onto a project below.",
    "elaborati.dropOnProject": "Drop to upload here",
    "elaborati.uploadedToast": "{name} uploaded",
    "elaborati.deleteTitle": "Delete deliverable",
    "elaborati.deleteDescription":
      "Delete {name}? This removes the file and all stored versions. This action cannot be undone.",
    "elaborati.deletedToast": "{name} deleted",
    "contacts.loading": "Loading contacts...",
    "contacts.emptyTitle": "No contacts yet",
    "contacts.emptySearchTitle": "No contacts match your search",
    "suppliers.loading": "Loading suppliers...",
    "suppliers.emptyTitle": "No suppliers yet",
    "suppliers.emptySearchTitle": "No suppliers match your search",
    "common.retry": "Retry",
    "common.saved": "Saved",
    "common.uploading": "Uploading...",
    "common.change": "Change",
    "common.remove": "Remove",
    "common.logo": "Logo",
    "common.upload": "Upload",
    "common.notAuthenticated": "Not authenticated",
    "settings.preferences.generalTitle": "General",
    "settings.preferences.generalDescription":
      "Choose how Archiviio looks and feels.",
    "settings.preferences.saved": "Preferences saved",
    "settings.preferences.languageLabel": "Language",
    "settings.preferences.themeLabel": "Theme",
    "settings.preferences.behavior": "Behavior",
    "settings.preferences.behaviorDescription":
      "Control startup and app notification defaults.",
    "settings.preferences.openDashboardOnStartup": "Open dashboard on startup",
    "settings.preferences.openDashboardOnStartupDescription":
      "Start in the dashboard when you open Archiviio.",
    "settings.preferences.enableProjectNotifications":
      "Enable project notifications",
    "settings.preferences.enableProjectNotificationsDescription":
      "Stay informed about project activity and updates.",
    "settings.preferences.managePreferences": "Manage preferences",
    "settings.profile.loading": "Loading profile...",
    "settings.profile.sectionTitle": "Personal information",
    "settings.profile.photoLabel": "Profile photo",
    "settings.profile.photoHint": "JPG, PNG, WebP or GIF. Max 5 MB.",
    "settings.profile.firstNameRequired": "First name is required",
    "settings.profile.emailInvalid": "Enter a valid email address",
    "settings.profile.phoneInvalid": "Enter a valid phone number",
    "settings.profile.emailConfirm":
      "Check your inbox to confirm the new email address",
    "settings.profile.updated": "Profile updated",
    "settings.profile.photoUpdated": "Photo updated",
    "settings.profile.photoRemoved": "Photo removed",
    "settings.profile.photoRemoveFailed": "Failed to remove photo",
    "settings.profile.role": "Role",
    "settings.profile.roleHint": "Your role in this workspace.",
    "settings.profile.bio": "Short bio",
    "settings.profile.bioPlaceholder": "A few words about you...",
    "settings.workspace.loading": "Loading workspace...",
    "settings.workspace.sectionTitle": "Studio details",
    "settings.workspace.logoLabel": "Studio logo",
    "settings.workspace.logoHint": "Square images work best. Max 5 MB.",
    "settings.workspace.nameRequired": "Workspace name is required",
    "settings.workspace.emailInvalid": "Enter a valid email address",
    "settings.workspace.phoneInvalid": "Enter a valid phone number",
    "settings.workspace.websiteInvalid": "Enter a valid website URL",
    "settings.workspace.updated": "Workspace updated",
    "settings.workspace.logoUpdated": "Logo updated",
    "settings.workspace.logoRemoved": "Logo removed",
    "settings.workspace.logoRemoveFailed": "Failed to remove logo",
    "settings.workspace.code": "Workspace code",
    "settings.workspace.codeHint": "Internal reference for your studio.",
    "settings.workspace.address": "Address",
    "settings.workspace.postalCode": "Postal code",
    "settings.workspace.city": "City",
    "settings.workspace.country": "Country",
    "settings.workspace.website": "Website",
    "settings.workspace.websitePlaceholder": "www.studio.com",
    "settings.security.changePassword": "Change password",
    "settings.security.changePasswordDescription":
      "We will send a secure link to your email so you can choose a new password.",
    "settings.security.newPassword": "New password",
    "settings.security.confirmPassword": "Confirm password",
    "settings.security.passwordMinLength":
      "Password must be at least 8 characters",
    "settings.security.passwordMismatch": "Passwords do not match",
    "settings.security.updating": "Updating...",
    "settings.security.updatePassword": "Update password",
    "settings.security.passwordUpdated": "Password updated",
    "settings.security.sendPasswordReset": "Send reset email",
    "settings.security.sendingPasswordReset": "Sending...",
    "settings.security.passwordResetSent":
      "Check your inbox for the password reset email from Archiviio.",
    "settings.security.passwordResetHint":
      "The email contains a secure link to set a new password.",
    "settings.security.resetPasswordPageDescription":
      "Choose a new password for your Archiviio account.",
    "settings.security.deleteAccount": "Delete account",
    "settings.security.deleteAccountDescription":
      "Permanently remove your account and related data.",
    "settings.security.deleteAccountConfirmTitle": "Delete account permanently?",
    "settings.security.deleteAccountConfirmDescriptionOwner":
      "This will permanently delete your profile, your entire workspace, and all projects, files, contacts, tasks, and other data inside it. This action cannot be undone.",
    "settings.security.deleteAccountConfirmDescriptionMember":
      "This will permanently delete your profile and remove your access to this workspace. The workspace and its data will remain for the other members.",
    "settings.security.deleteAccountConfirm": "Delete permanently",
    "settings.security.deletingAccount": "Deleting...",
    "settings.security.accountDeleted": "Account deleted",
    "settings.security.activeSessions": "Active sessions",
    "settings.security.activeSessionsDescription":
      "Devices where you are currently signed in.",
    "settings.security.loadingSession": "Loading session...",
    "settings.security.thisDevice": "This device",
    "settings.security.currentSession": "Current session",
    "settings.security.lastSignIn": "Last sign in",
    "settings.security.lastSignInUnknown": "Unknown",
    "settings.security.logoutCurrent": "Logout current session",
    "settings.security.logoutAll": "Logout all sessions",
    "nomenclature.loading": "Loading nomenclature...",
    "nomenclature.loadError": "Failed to load nomenclature",
    "nomenclature.noNotes": "No notes yet",
    "nomenclature.deleteAria": "Delete {name}",
    "tasks.noTasks": "No tasks yet",
    "tasks.addTask": "Add task",
    "tasks.noTasksSearch": "No tasks match your search",
    "tasks.clearSearch": "Clear search",
    "tasks.viewTasks": "View tasks",
    "tasks.markComplete": "Mark task as complete",
    "tasks.markIncomplete": "Mark task as incomplete",
    "tasks.notePrefix": "Note: ",
    "tasks.urgencyLow": "Low",
    "tasks.urgencyMedium": "Medium",
    "tasks.urgencyHigh": "High",
    "projects.statusActive": "Active",
    "projects.statusOnHold": "On hold",
    "projects.statusCompleted": "Completed",
    "projects.statusArchived": "Archived",
    "projects.activityTitle": "Project activity",
    "navigation.sidebarAria": "Sidebar navigation",
    "navigation.more": "More",
    "navigation.moreDescription": "Additional navigation links",
    "navigation.bottomNavAria": "Main navigation",
    "navigation.menu": "Open menu",
    "activity.noRecent": "No recent activity yet",
    "activity.today": "Today",
    "ai.commandOrNavigate": "Command or navigate",
    "ai.placeholder": 'e.g. "Mioni", "find lighting suppliers"',
    "ai.commandAria": "Command",
    "ai.branding": "Archiviio Intelligence",
    "ai.suggestedCommands": "Suggested commands",
    "auth.signIn": "Sign in",
    "auth.signInDescription": "Enter your credentials to access your workspace.",
    "auth.signingIn": "Signing in...",
    "auth.password": "Password",
    "auth.noAccount": "No account?",
    "auth.createOne": "Create one",
    "auth.emailPlaceholder": "you@studio.com",
    "auth.authCallbackFailed":
      "Sign-in link expired or is invalid. Try signing in again.",
    "auth.emailLinkExpired":
      "The confirmation link has expired. Sign in with your email and password, or create a new account.",
    "auth.workspaceSetupFailed":
      "Could not set up your workspace. Try signing in again.",
    "auth.emailNotFound":
      "No account found with this email. Check the spelling or create a new account.",
    "auth.emailNotConfirmed":
      "Email not confirmed yet. Use the button below to resend the confirmation email.",
    "auth.invalidCredentials":
      "Wrong email or password. Try again or create a new account.",
    "auth.signUp": "Create account",
    "auth.signUpDescription": "Start managing your studio workspace.",
    "auth.signingUp": "Creating account...",
    "auth.fullName": "Full name",
    "auth.fullNamePlaceholder": "Your name",
    "auth.confirmPassword": "Confirm password",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.passwordMinLength": "Password must be at least 8 characters",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.signInLink": "Sign in",
    "auth.accountCreated": "Account created",
    "auth.checkEmail": "Check your email to confirm your account.",
  },
  it: {
    "common.loading": "Caricamento...",
    "common.signOut": "Esci",
    "navigation.dashboard": "Dashboard",
    "navigation.projects": "Progetti",
    "navigation.tasks": "Attività",
    "navigation.contacts": "Contatti",
    "navigation.suppliers": "Fornitori",
    "navigation.documents": "Documenti di studio",
    "navigation.mail": "Mail",
    "navigation.notes": "Note",
    "navigation.nomenclature": "Nomenclatura",
    "navigation.settings": "Impostazioni",
    "navigation.newProject": "Nuovo progetto",
    "navigation.project": "Progetto",
    "navigation.appName": "Archiviio",
    "settings.profile.label": "Profilo",
    "settings.profile.description": "Il tuo account personale",
    "settings.profile.pageDescription": "Gestisci i dettagli del tuo account.",
    "settings.workspace.label": "Workspace",
    "settings.workspace.description": "Dettagli studio",
    "settings.workspace.pageDescription": "Gestisci il tuo workspace di studio.",
    "settings.team.label": "Team",
    "settings.team.description": "Membri e accessi",
    "settings.team.pageDescription": "Collabora con il team del tuo studio.",
    "settings.preferences.label": "Preferenze",
    "settings.preferences.description": "Lingua, aspetto e sicurezza",
    "settings.preferences.pageDescription":
      "Personalizza lingua, aspetto, comportamento e sicurezza.",
    "quickActions.createProject": "Crea progetto",
    "quickActions.createContact": "Crea contatto",
    "quickActions.uploadDocument": "Carica elaborato",
    "quickActions.createSupplier": "Aggiungi fornitore",
    "dashboard.recentProjects": "Progetti recenti",
    "dashboard.viewAll": "Vedi tutti",
    "dashboard.upcomingTasks": "Attività in scadenza",
    "dashboard.note": "Note",
    "dashboard.quickActions": "Azioni rapide",
    "profile.firstName": "Nome",
    "profile.lastName": "Cognome",
    "profile.email": "Email",
    "profile.profession": "Ruolo",
    "profile.phone": "Telefono",
    "profile.detailsPlaceholder": "I dettagli profilo appariranno qui.",
    "profile.manage": "Gestisci profilo",
    "workspace.name": "Nome studio",
    "workspace.generalEmail": "Email generale",
    "workspace.invitedCollaborators": "Collaboratori invitati",
    "workspace.noInvites": "Nessun collaboratore invitato.",
    "workspace.manage": "Gestisci workspace",
    "team.manage": "Gestisci team",
    "search.open": "Apri ricerca",
    "search.trigger": "Cerca",
    "search.triggerLong": "Cerca progetti, contatti, documenti di studio...",
    "search.dialogTitle": "Ricerca",
    "search.dialogDescription":
      "Cerca progetti, contatti, documenti di studio e altro in Archiviio",
    "search.placeholder": "Cerca per nome...",
    "search.running": "Ricerca in corso...",
    "search.error": "Errore durante la ricerca. Riprova.",
    "search.projects": "Progetti",
    "search.projectCodes": "Codici progetto",
    "search.contacts": "Contatti",
    "search.suppliers": "Fornitori",
    "search.documents": "Documenti di studio",
    "search.tags": "Tag",
    "search.nomenclature": "Nomenclatura",
    "search.quickActions": "Azioni rapide",
    "search.recent": "Ricerche recenti",
    "search.navigation": "Navigazione",
    "notes.loading": "Caricamento note...",
    "notes.add": "Aggiungi nota",
    "notes.noContent": "Nessun contenuto",
    "notes.retry": "Riprova",
    "notes.emptyTitle": "Nessuna nota",
    "notes.deleteTitle": "Elimina nota",
    "notes.deleteDescription":
      "Eliminare \"{title}\"? Questa azione non può essere annullata.",
    "notes.cancel": "Annulla",
    "notes.deleting": "Eliminazione...",
    "notes.delete": "Elimina",
    "notes.deletedToast": "\"{title}\" eliminata",
    "notes.savedToast": "Nota salvata",
    "notes.saveError": "Salvataggio nota non riuscito",
    "notes.optionalTitle": "Titolo facoltativo",
    "notes.write": "Scrivi una nota...",
    "notes.saving": "Salvataggio...",
    "notes.send": "Invia",
    "team.membersTitle": "Membri team",
    "team.membersDescription":
      "Invita colleghi per condividere progetti e attività.",
    "team.loading": "Caricamento team...",
    "team.notActiveTitle": "Collaborazione team non ancora attiva",
    "team.notActiveDescription":
      "Quando i workspace multiutente saranno disponibili potrai invitare colleghi e gestire i ruoli qui.",
    "team.roleOwner": "Proprietario",
    "team.roleMember": "Membro",
    "team.inviteHint": "Invia un invito email per entrare nel workspace.",
    "team.inviteeEmail": "Email invitato",
    "team.sending": "Invio...",
    "team.inviteByEmail": "Invita via email",
    "team.invitationSent": "Invito inviato a {email}",
    "team.invitationSaved": "Invito salvato per {email}",
    "team.invitationLinkCopied":
      "Link invito copiato per {email}. Condividilo con il tuo collega.",
    "team.invitationLinkReady":
      "Invito creato per {email}. Copia il link qui sotto e mandalo al tuo collega.",
    "team.invitationEmailFailed":
      "Invito salvato per {email}, ma l'email non è stata inviata: {error}",
    "team.copyInviteLink": "Copia link",
    "common.cancel": "Annulla",
    "common.delete": "Elimina",
    "common.deleting": "Eliminazione...",
    "common.saving": "Salvataggio...",
    "common.creating": "Creazione...",
    "common.saveChanges": "Salva modifiche",
    "common.close": "Chiudi",
    "common.workspaceNotFound": "Workspace non trovato",
    "contacts.addTitle": "Aggiungi contatto",
    "contacts.editTitle": "Modifica contatto",
    "contacts.deleteTitle": "Elimina contatto",
    "contacts.deleteDescription":
      "Eliminare {name}? Questa azione non può essere annullata.",
    "contacts.deletedToast": "{name} eliminato",
    "contacts.nameRequired": "Il nome è obbligatorio.",
    "contacts.createdToast": "Contatto creato",
    "contacts.updatedToast": "Contatto aggiornato",
    "suppliers.addTitle": "Aggiungi fornitore",
    "suppliers.editTitle": "Modifica fornitore",
    "suppliers.deleteTitle": "Elimina fornitore",
    "suppliers.deleteDescription":
      "Eliminare {name}? Questa azione non può essere annullata.",
    "suppliers.deletedToast": "{name} eliminato",
    "suppliers.companyRequired": "L'azienda è obbligatoria.",
    "suppliers.createdToast": "Fornitore creato",
    "suppliers.updatedToast": "Fornitore aggiornato",
    "suppliers.inMaterialLibrary": "Presente in materioteca",
    "suppliers.inMaterialLibraryHint":
      "Attiva se conservi i campioni fisici di questo fornitore in studio.",
    "suppliers.filterAllSamples": "Tutte le disponibilità campioni",
    "suppliers.filterSamplesInLibrary": "Campioni in materioteca",
    "suppliers.filterSamplesNotInLibrary": "Senza campioni in materioteca",
    "suppliers.materialLibraryBadge": "In materioteca",
    "nomenclature.addTitle": "Aggiungi regola",
    "nomenclature.editTitle": "Modifica regola",
    "nomenclature.addDescription":
      "Aggiungi un titolo e note su come nominare file o progetti.",
    "nomenclature.editDescription":
      "Aggiorna titolo e note per questa regola di nomenclatura.",
    "nomenclature.deleteTitle": "Elimina regola",
    "nomenclature.deleteDescription":
      "Eliminare \"{name}\"? Questa azione non può essere annullata.",
    "nomenclature.deletedToast": "\"{name}\" eliminata",
    "nomenclature.titleRequired": "Il titolo è obbligatorio.",
    "nomenclature.createdToast": "Regola creata",
    "nomenclature.updatedToast": "Regola aggiornata",
    "nomenclature.saveError": "Salvataggio regola non riuscito",
    "notes.addTitle": "Aggiungi nota",
    "notes.editTitle": "Modifica nota",
    "notes.addDescription":
      "Annota un pensiero o un promemoria per il tuo workspace.",
    "notes.editDescription":
      "Aggiorna titolo e contenuto di questa nota.",
    "notes.contentRequired": "Aggiungi un titolo o del contenuto.",
    "notes.createdToast": "Nota creata",
    "notes.updatedToast": "Nota aggiornata",
    "documents.emptyTitle": "Nessun documento di studio",
    "documents.emptySearchTitle": "Nessun documento di studio corrisponde alla ricerca",
    "documents.loading": "Caricamento documenti di studio...",
    "documents.uploadTitle": "Carica documento di studio",
    "documents.uploadDescription":
      "Carica contratti, tabulati e altri file dello studio non legati a un progetto.",
    "documents.uploadedToast": "{name} caricato",
    "documents.dropzoneHint": "Trascina i file qui o clicca per caricare",
    "documents.dropzoneActive": "Rilascia i file per caricare",
    "documents.dropzoneAllowed": "{types} · max {size} per file",
    "documents.uploadFailed": "Errore",
    "documents.deleteTitle": "Elimina documento di studio",
    "documents.deleteDescription":
      "Eliminare {name}? Verranno rimossi il file e tutte le versioni salvate. Questa azione non può essere annullata.",
    "documents.deletedToast": "{name} eliminato",
    "elaborati.uploadTitle": "Carica elaborato",
    "elaborati.uploadDescription":
      "Scegli un progetto o trascina i file su un progetto qui sotto.",
    "elaborati.dropOnProject": "Rilascia per caricare qui",
    "elaborati.uploadedToast": "{name} caricato",
    "elaborati.deleteTitle": "Elimina elaborato",
    "elaborati.deleteDescription":
      "Eliminare {name}? Verranno rimossi il file e tutte le versioni salvate. Questa azione non può essere annullata.",
    "elaborati.deletedToast": "{name} eliminato",
    "contacts.loading": "Caricamento contatti...",
    "contacts.emptyTitle": "Nessun contatto",
    "contacts.emptySearchTitle": "Nessun contatto corrisponde alla ricerca",
    "suppliers.loading": "Caricamento fornitori...",
    "suppliers.emptyTitle": "Nessun fornitore",
    "suppliers.emptySearchTitle": "Nessun fornitore corrisponde alla ricerca",
    "common.retry": "Riprova",
    "common.saved": "Salvato",
    "common.uploading": "Caricamento...",
    "common.change": "Cambia",
    "common.remove": "Rimuovi",
    "common.logo": "Logo",
    "common.upload": "Carica",
    "common.notAuthenticated": "Non autenticato",
    "settings.preferences.generalTitle": "Generale",
    "settings.preferences.generalDescription":
      "Scegli come Archiviio appare e si comporta.",
    "settings.preferences.saved": "Preferenze salvate",
    "settings.preferences.languageLabel": "Lingua",
    "settings.preferences.themeLabel": "Tema",
    "settings.preferences.behavior": "Comportamento",
    "settings.preferences.behaviorDescription":
      "Gestisci avvio e notifiche app predefinite.",
    "settings.preferences.openDashboardOnStartup": "Apri la dashboard all'avvio",
    "settings.preferences.openDashboardOnStartupDescription":
      "Apri Archiviio direttamente nella dashboard.",
    "settings.preferences.enableProjectNotifications":
      "Attiva notifiche progetto",
    "settings.preferences.enableProjectNotificationsDescription":
      "Resta aggiornato su attività e modifiche dei progetti.",
    "settings.preferences.managePreferences": "Gestisci preferenze",
    "settings.profile.loading": "Caricamento profilo...",
    "settings.profile.sectionTitle": "Informazioni personali",
    "settings.profile.photoLabel": "Foto profilo",
    "settings.profile.photoHint": "JPG, PNG, WebP o GIF. Max 5 MB.",
    "settings.profile.firstNameRequired": "Il nome è obbligatorio",
    "settings.profile.emailInvalid": "Inserisci un indirizzo email valido",
    "settings.profile.phoneInvalid": "Inserisci un numero di telefono valido",
    "settings.profile.emailConfirm":
      "Controlla la posta per confermare il nuovo indirizzo email",
    "settings.profile.updated": "Profilo aggiornato",
    "settings.profile.photoUpdated": "Foto aggiornata",
    "settings.profile.photoRemoved": "Foto rimossa",
    "settings.profile.photoRemoveFailed": "Rimozione foto non riuscita",
    "settings.profile.role": "Ruolo",
    "settings.profile.roleHint": "Il tuo ruolo in questo workspace.",
    "settings.profile.bio": "Breve bio",
    "settings.profile.bioPlaceholder": "Qualche parola su di te...",
    "settings.workspace.loading": "Caricamento workspace...",
    "settings.workspace.sectionTitle": "Dettagli studio",
    "settings.workspace.logoLabel": "Logo studio",
    "settings.workspace.logoHint":
      "Le immagini quadrate funzionano meglio. Max 5 MB.",
    "settings.workspace.nameRequired": "Il nome workspace è obbligatorio",
    "settings.workspace.emailInvalid": "Inserisci un indirizzo email valido",
    "settings.workspace.phoneInvalid": "Inserisci un numero di telefono valido",
    "settings.workspace.websiteInvalid": "Inserisci un URL valido",
    "settings.workspace.updated": "Workspace aggiornato",
    "settings.workspace.logoUpdated": "Logo aggiornato",
    "settings.workspace.logoRemoved": "Logo rimosso",
    "settings.workspace.logoRemoveFailed": "Rimozione logo non riuscita",
    "settings.workspace.code": "Codice workspace",
    "settings.workspace.codeHint": "Riferimento interno per il tuo studio.",
    "settings.workspace.address": "Indirizzo",
    "settings.workspace.postalCode": "CAP",
    "settings.workspace.city": "Città",
    "settings.workspace.country": "Paese",
    "settings.workspace.website": "Sito web",
    "settings.workspace.websitePlaceholder": "www.studio.com",
    "settings.security.changePassword": "Cambia password",
    "settings.security.changePasswordDescription":
      "Ti invieremo un link sicuro via email per scegliere una nuova password.",
    "settings.security.newPassword": "Nuova password",
    "settings.security.confirmPassword": "Conferma password",
    "settings.security.passwordMinLength":
      "La password deve avere almeno 8 caratteri",
    "settings.security.passwordMismatch": "Le password non coincidono",
    "settings.security.updating": "Aggiornamento...",
    "settings.security.updatePassword": "Aggiorna password",
    "settings.security.passwordUpdated": "Password aggiornata",
    "settings.security.sendPasswordReset": "Invia email di reset",
    "settings.security.sendingPasswordReset": "Invio...",
    "settings.security.passwordResetSent":
      "Controlla la posta: ti abbiamo inviato l'email da Archiviio per cambiare la password.",
    "settings.security.passwordResetHint":
      "L'email contiene un link sicuro per impostare una nuova password.",
    "settings.security.resetPasswordPageDescription":
      "Scegli una nuova password per il tuo account Archiviio.",
    "settings.security.deleteAccount": "Elimina account",
    "settings.security.deleteAccountDescription":
      "Rimuove in modo permanente il tuo account e i dati collegati.",
    "settings.security.deleteAccountConfirmTitle": "Eliminare l'account in modo definitivo?",
    "settings.security.deleteAccountConfirmDescriptionOwner":
      "Eliminerai in modo permanente il tuo profilo, l'intero spazio di lavoro e tutti i progetti, file, contatti, attività e altri dati al suo interno. Questa azione non può essere annullata.",
    "settings.security.deleteAccountConfirmDescriptionMember":
      "Eliminerai in modo permanente il tuo profilo e perderai l'accesso a questo spazio di lavoro. Lo spazio e i suoi dati resteranno per gli altri membri.",
    "settings.security.deleteAccountConfirm": "Elimina definitivamente",
    "settings.security.deletingAccount": "Eliminazione...",
    "settings.security.accountDeleted": "Account eliminato",
    "settings.security.activeSessions": "Sessioni attive",
    "settings.security.activeSessionsDescription":
      "Dispositivi in cui sei attualmente connesso.",
    "settings.security.loadingSession": "Caricamento sessione...",
    "settings.security.thisDevice": "Questo dispositivo",
    "settings.security.currentSession": "Sessione corrente",
    "settings.security.lastSignIn": "Ultimo accesso",
    "settings.security.lastSignInUnknown": "Sconosciuto",
    "settings.security.logoutCurrent": "Esci da questa sessione",
    "settings.security.logoutAll": "Esci da tutte le sessioni",
    "nomenclature.loading": "Caricamento nomenclatura...",
    "nomenclature.loadError": "Caricamento nomenclatura non riuscito",
    "nomenclature.noNotes": "Nessuna nota",
    "nomenclature.deleteAria": "Elimina {name}",
    "tasks.noTasks": "Nessuna attività",
    "tasks.addTask": "Aggiungi attività",
    "tasks.noTasksSearch": "Nessuna attività corrisponde alla ricerca",
    "tasks.clearSearch": "Pulisci ricerca",
    "tasks.viewTasks": "Vedi attività",
    "tasks.markComplete": "Segna attività come completata",
    "tasks.markIncomplete": "Segna attività come incompleta",
    "tasks.notePrefix": "Nota: ",
    "tasks.urgencyLow": "Bassa",
    "tasks.urgencyMedium": "Media",
    "tasks.urgencyHigh": "Alta",
    "projects.statusActive": "Attivo",
    "projects.statusOnHold": "In pausa",
    "projects.statusCompleted": "Completato",
    "projects.statusArchived": "Archiviato",
    "projects.activityTitle": "Attività progetto",
    "navigation.sidebarAria": "Navigazione barra laterale",
    "navigation.more": "Altro",
    "navigation.moreDescription": "Collegamenti di navigazione aggiuntivi",
    "navigation.bottomNavAria": "Navigazione principale",
    "navigation.menu": "Apri menu",
    "activity.noRecent": "Nessuna attività recente",
    "activity.today": "Oggi",
    "ai.commandOrNavigate": "Comando o navigazione",
    "ai.placeholder": 'es. "Mioni", "trova fornitori illuminazione"',
    "ai.commandAria": "Comando",
    "ai.branding": "Archiviio Intelligence",
    "ai.suggestedCommands": "Comandi suggeriti",
    "auth.signIn": "Accedi",
    "auth.signInDescription":
      "Inserisci le tue credenziali per accedere al workspace.",
    "auth.signingIn": "Accesso in corso...",
    "auth.password": "Password",
    "auth.noAccount": "Nessun account?",
    "auth.createOne": "Creane uno",
    "auth.emailPlaceholder": "tu@studio.com",
    "auth.authCallbackFailed":
      "Link di accesso scaduto o non valido. Riprova ad accedere.",
    "auth.emailLinkExpired":
      "Il link di conferma è scaduto. Accedi con email e password, oppure crea un nuovo account.",
    "auth.workspaceSetupFailed":
      "Impossibile configurare il workspace. Riprova ad accedere.",
    "auth.emailNotFound":
      "Nessun account con questa email. Controlla l'ortografia o crea un nuovo account.",
    "auth.emailNotConfirmed":
      "Email non ancora confermata. Usa il pulsante qui sotto per reinviare l'email di conferma.",
    "auth.invalidCredentials":
      "Email o password errati. Riprova o crea un nuovo account.",
    "auth.signUp": "Crea account",
    "auth.signUpDescription": "Inizia a gestire il tuo workspace di studio.",
    "auth.signingUp": "Creazione account...",
    "auth.fullName": "Nome completo",
    "auth.fullNamePlaceholder": "Il tuo nome",
    "auth.confirmPassword": "Conferma password",
    "auth.passwordMismatch": "Le password non coincidono",
    "auth.passwordMinLength": "La password deve avere almeno 8 caratteri",
    "auth.alreadyHaveAccount": "Hai già un account?",
    "auth.signInLink": "Accedi",
    "auth.accountCreated": "Account creato",
    "auth.checkEmail": "Controlla la posta per confermare il tuo account.",
  },
};

export function t(language: AppLanguage, key: TranslationKey): string {
  return translations[language][key];
}
