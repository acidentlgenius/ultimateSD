'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateProfile, deleteAccount } from '@/app/actions/settings';
import { toast } from 'sonner';
import { User as UserIcon, AlertTriangle, Loader2, CreditCard } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


interface SettingsClientProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        username?: string | null;
        bio?: string | null;
        isPublic?: boolean | null;
    };
}

export default function SettingsClient({ user }: SettingsClientProps) {
    const router = useRouter();
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
    const [bio, setBio] = useState(user.bio || '');
    const [isPublic, setIsPublic] = useState(user.isPublic ?? true);
    const [isPending, startTransition] = useTransition();

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.append('name', name);
            if (username) formData.append('username', username);
            if (bio) formData.append('bio', bio);
            formData.append('isPublic', String(isPublic));

            const result = await updateProfile(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Profile updated successfully');
                router.refresh();
            }
        });
    };

    const handleDeleteAccount = () => {
        if (confirm('Are you absolutely sure? This action cannot be undone. All your progress will be lost forever.')) {
            startTransition(async () => {
                const result = await deleteAccount();
                if (result && result.error) {
                    toast.error(result.error);
                }
            });
        }
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-muted/20 backdrop-blur-sm border border-white/5 rounded-xl">
                    <TabsTrigger
                        value="general"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                    >
                        <UserIcon className="w-4 h-4" /> General
                    </TabsTrigger>

                    <TabsTrigger
                        value="billing"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                    >
                        <CreditCard className="w-4 h-4" /> Billing
                    </TabsTrigger>

                    <TabsTrigger
                        value="danger"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 data-[state=active]:shadow-none transition-all"
                    >
                        <AlertTriangle className="w-4 h-4" /> Advanced
                    </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                    <Card className="glass-card border-white/5 shadow-xl shadow-black/5">
                        <CardHeader>
                            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Profile Information</CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Update your display name and public profile information.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Display Name</label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        maxLength={50}
                                        className="bg-muted/30 border-white/10 focus:border-primary/50 transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm font-mono bg-muted/30 px-2 py-2 rounded-md border border-white/5">ultimatesd.ai/u/</span>
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username"
                                            maxLength={20}
                                            pattern="[a-zA-Z0-9_-]+"
                                            className="bg-muted/30 border-white/10 focus:border-primary/50 transition-colors font-mono"
                                        />
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground/80">
                                        Unique username for your public profile.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                                    <Textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        className="resize-none bg-muted/30 border-white/10 focus:border-primary/50 transition-colors min-h-[100px]"
                                        maxLength={160}
                                    />
                                    <p className="text-xs text-muted-foreground text-right font-mono">
                                        {bio.length}/160
                                    </p>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-br from-muted/30 to-muted/10 p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Public Profile</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow others to see your progress and achievements.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isPublic}
                                        onCheckedChange={setIsPublic}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Email</label>
                                    <Input value={user.email || ''} disabled className="bg-muted/50 opacity-70 cursor-not-allowed border-dashed" />
                                    <p className="text-[0.8rem] text-muted-foreground/80">Email change is not supported yet.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/5 border-t border-white/5 py-4">
                                <Button type="submit" disabled={isPending} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>



                <TabsContent value="danger" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                    <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm shadow-inner">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account
                            </CardTitle>
                            <CardDescription className="text-red-500/70">
                                Permanently delete your account and all associated data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-background/50 border border-red-500/10 rounded-lg p-4 mb-6">
                                <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                                    This action is <span className="text-red-500 font-bold">irreversible</span>. It will delete your progress, experience points, and learning history.
                                    Please be certain.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                    <Card className="glass-card border-white/5 shadow-xl shadow-black/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Subscription
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Manage your billing and subscription plan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                                <div>
                                    <h3 className="font-semibold text-lg">Current Plan</h3>
                                    <p className="text-sm text-muted-foreground">You are currently on the <span className="font-medium text-foreground">Free Plan</span>.</p>
                                </div>
                                <Button asChild variant="default" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
                                    <a href="/pricing">Upgrade to Pro</a>
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Upgrade to Pro to unlock unlimited solutions, expert feedback, and more.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
