import { ProfileInfoCard } from './ProfileInfoCard';
import { ProfileSecurityCard } from './ProfileSecurityCard';
import { useProfilePage } from './useProfilePage';

export function ProfilePage() {
    const vm = useProfilePage();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
                <p className="text-muted-foreground">Gérez votre avatar, vos informations et votre sécurité.</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <ProfileInfoCard
                    email={vm.user?.email ?? ''}
                    roleName={vm.user?.role.name ?? ''}
                    fullName={vm.fullName}
                    initials={vm.initials}
                    avatarPreview={vm.avatarPreview}
                    avatarFile={vm.avatarFile}
                    isAvatarSubmitting={vm.isAvatarSubmitting}
                    profileForm={vm.profileForm}
                    onAvatarChange={vm.setAvatarFile}
                    onUploadAvatar={vm.onUploadAvatar}
                    onSubmitProfile={vm.onSubmitProfile}
                />

                <ProfileSecurityCard
                    showCurrentPassword={vm.showCurrentPassword}
                    showNewPassword={vm.showNewPassword}
                    showConfirmPassword={vm.showConfirmPassword}
                    passwordForm={vm.passwordForm}
                    onToggleCurrent={() => vm.setShowCurrentPassword((value) => !value)}
                    onToggleNew={() => vm.setShowNewPassword((value) => !value)}
                    onToggleConfirm={() => vm.setShowConfirmPassword((value) => !value)}
                    onSubmitPassword={vm.onSubmitPassword}
                />
            </div>
        </div>
    );
}