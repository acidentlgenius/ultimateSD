'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateProfile, deleteAccount } from '@/app/actions/settings';
import { toast } from 'sonner';
import { User as UserIcon, AlertTriangle, Loader2, CreditCard, Key } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { PLAN_LABELS, type PlanType } from '@/lib/plans';

interface SettingsClientProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        username?: string | null;
        bio?: string | null;
        isPublic?: boolean | null;
        planType?: string;
        planExpiresAt?: Date | null;
        aiCredits?: number;
        geminiApiKey?: string | null;
        xaiApiKey?: string | null;
        preferredProvider?: string;
    };
}

export default function SettingsClient({ user }: SettingsClientProps) {
    const router = useRouter();
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
    const [bio, setBio] = useState(user.bio || '');
    const [isPublic, setIsPublic] = useState(user.isPublic ?? true);
    const [geminiKey, setGeminiKey] = useState('');
    const [xaiKey, setXaiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [azureOpenaiKey, setAzureOpenaiKey] = useState('');
    const [azureOpenaiEndpoint, setAzureOpenaiEndpoint] = useState('');
    const [awsBedrockRegion, setAwsBedrockRegion] = useState('');
    const [awsBedrockAccessKey, setAwsBedrockAccessKey] = useState('');
    const [awsBedrockSecretKey, setAwsBedrockSecretKey] = useState('');
    const [ollamaEndpoint, setOllamaEndpoint] = useState('');
    const [ollamaModel, setOllamaModel] = useState('');
    const [preferredProvider, setPreferredProvider] = useState(user.preferredProvider ?? 'gemini');
    const [hasGeminiKey, setHasGeminiKey] = useState(false);
    const [hasXaiKey, setHasXaiKey] = useState(false);
    const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
    const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
    const [hasAzureOpenaiKey, setHasAzureOpenaiKey] = useState(false);
    const [hasAwsBedrockKey, setHasAwsBedrockKey] = useState(false);
    const [hasOllamaEndpoint, setHasOllamaEndpoint] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSavingKeys, setIsSavingKeys] = useState(false);

    const planType = (user.planType ?? 'free') as PlanType;
    const planLabel = PLAN_LABELS[planType] ?? 'Free';

    useEffect(() => {
        fetch('/api/user/keys')
            .then(res => res.json())
            .then(data => {
                if (data.hasGeminiKey !== undefined) setHasGeminiKey(data.hasGeminiKey);
                if (data.hasXaiKey !== undefined) setHasXaiKey(data.hasXaiKey);
                if (data.hasOpenaiKey !== undefined) setHasOpenaiKey(data.hasOpenaiKey);
                if (data.hasAnthropicKey !== undefined) setHasAnthropicKey(data.hasAnthropicKey);
                if (data.hasAzureOpenaiKey !== undefined) setHasAzureOpenaiKey(data.hasAzureOpenaiKey);
                if (data.hasAwsBedrockKey !== undefined) setHasAwsBedrockKey(data.hasAwsBedrockKey);
                if (data.hasOllamaEndpoint !== undefined) setHasOllamaEndpoint(data.hasOllamaEndpoint);
                if (data.preferredProvider) setPreferredProvider(data.preferredProvider);
            })
            .catch(() => undefined);
    }, []);

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

    const handleSaveKeys = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingKeys(true);
        try {
            const res = await fetch('/api/user/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geminiApiKey: geminiKey,
                    xaiApiKey: xaiKey,
                    openaiApiKey: openaiKey,
                    anthropicApiKey: anthropicKey,
                    azureOpenaiApiKey: azureOpenaiKey,
                    azureOpenaiEndpoint: azureOpenaiEndpoint,
                    awsBedrockRegion: awsBedrockRegion,
                    awsBedrockAccessKey: awsBedrockAccessKey,
                    awsBedrockSecretKey: awsBedrockSecretKey,
                    ollamaEndpoint: ollamaEndpoint,
                    ollamaModel: ollamaModel,
                    preferredProvider,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to save keys');

            if (geminiKey) setHasGeminiKey(true);
            if (xaiKey) setHasXaiKey(true);
            if (openaiKey) setHasOpenaiKey(true);
            if (anthropicKey) setHasAnthropicKey(true);
            if (azureOpenaiKey) setHasAzureOpenaiKey(true);
            if (awsBedrockAccessKey) setHasAwsBedrockKey(true);
            if (ollamaEndpoint) setHasOllamaEndpoint(true);
            setGeminiKey('');
            setXaiKey('');
            setOpenaiKey('');
            setAnthropicKey('');
            setAzureOpenaiKey('');
            setAzureOpenaiEndpoint('');
            setAwsBedrockRegion('');
            setAwsBedrockAccessKey('');
            setAwsBedrockSecretKey('');
            setOllamaEndpoint('');
            setOllamaModel('');
            toast.success('API keys saved securely');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save keys');
        } finally {
            setIsSavingKeys(false);
        }
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
                <TabsList className="grid w-full grid-cols-4 mb-8 p-1 bg-muted/20 backdrop-blur-sm border border-white/5 rounded-xl">
                    <TabsTrigger value="general" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <UserIcon className="w-4 h-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <CreditCard className="w-4 h-4" /> Billing
                    </TabsTrigger>
                    <TabsTrigger value="keys" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Key className="w-4 h-4" /> API Keys
                    </TabsTrigger>
                    <TabsTrigger value="danger" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500">
                        <AlertTriangle className="w-4 h-4" /> Advanced
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="glass-card border-white/5 shadow-xl shadow-black/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold tracking-tight">Profile Information</CardTitle>
                            <CardDescription>Update your display name and public profile information.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Display Name</label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium">Username</label>
                                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-white/5 p-4">
                                    <div>
                                        <Label>Public Profile</Label>
                                        <p className="text-sm text-muted-foreground">Allow others to see your progress.</p>
                                    </div>
                                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input value={user.email || ''} disabled />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="billing">
                    <Card className="glass-card border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Subscription</CardTitle>
                            <CardDescription>Manage your plan and billing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                                <div>
                                    <h3 className="font-semibold text-lg">Current Plan</h3>
                                    <p className="text-sm text-muted-foreground">
                                        You are on the <span className="font-medium text-foreground">{planLabel} Plan</span>.
                                    </p>
                                    {user.planExpiresAt && planType !== 'free' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Renews / expires {new Date(user.planExpiresAt).toLocaleDateString()}
                                        </p>
                                    )}
                                    {(planType === 'ai' || planType === 'free') && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {user.aiCredits ?? 0} AI credits remaining this month
                                        </p>
                                    )}
                                </div>
                                {planType === 'free' && (
                                    <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <Link href="/pricing">Upgrade</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="keys">
                    <Card className="glass-card border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Bring Your Own Key</CardTitle>
                            <CardDescription>
                                Add your API key to use AI when credits run out (free plan) or as your primary AI source (platform plan). Keys are stored securely and never shown again.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveKeys}>
                            <CardContent className="space-y-6">
                                {planType === 'platform' && (
                                    <p className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                        Platform plan requires an API key to use AI on all problems.
                                    </p>
                                )}
                                {planType === 'free' && (
                                    <p className="text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
                                        Free plan: use included monthly credits on starter problems, or add your own API key for unlimited AI on those problems.
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="gemini-key">Gemini API Key {hasGeminiKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input
                                        id="gemini-key"
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        placeholder={hasGeminiKey ? 'Enter new key to replace' : 'AIza...'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="xai-key">xAI API Key (optional) {hasXaiKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input
                                        id="xai-key"
                                        type="password"
                                        value={xaiKey}
                                        onChange={(e) => setXaiKey(e.target.value)}
                                        placeholder="xai-..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="openai-key">OpenAI API Key {hasOpenaiKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input id="openai-key" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="anthropic-key">Anthropic API Key {hasAnthropicKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input id="anthropic-key" type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="azure-key">Azure OpenAI API Key {hasAzureOpenaiKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input id="azure-key" type="password" value={azureOpenaiKey} onChange={(e) => setAzureOpenaiKey(e.target.value)} placeholder="Enter Azure API Key" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="azure-endpoint">Azure OpenAI Endpoint</Label>
                                    <Input id="azure-endpoint" type="text" value={azureOpenaiEndpoint} onChange={(e) => setAzureOpenaiEndpoint(e.target.value)} placeholder="https://your-resource.openai.azure.com/" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aws-region">AWS Bedrock Region</Label>
                                    <Input id="aws-region" type="text" value={awsBedrockRegion} onChange={(e) => setAwsBedrockRegion(e.target.value)} placeholder="us-east-1" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aws-access-key">AWS Bedrock Access Key {hasAwsBedrockKey && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input id="aws-access-key" type="password" value={awsBedrockAccessKey} onChange={(e) => setAwsBedrockAccessKey(e.target.value)} placeholder="AKIA..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aws-secret-key">AWS Bedrock Secret Key</Label>
                                    <Input id="aws-secret-key" type="password" value={awsBedrockSecretKey} onChange={(e) => setAwsBedrockSecretKey(e.target.value)} placeholder="Enter Secret Key" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ollama-endpoint">Ollama Endpoint {hasOllamaEndpoint && <span className="text-green-600">(saved)</span>}</Label>
                                    <Input id="ollama-endpoint" type="text" value={ollamaEndpoint} onChange={(e) => setOllamaEndpoint(e.target.value)} placeholder="http://127.0.0.1:11434" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ollama-model">Ollama Model</Label>
                                    <Input id="ollama-model" type="text" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} placeholder="llama3" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Preferred provider</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button type="button" variant={preferredProvider === 'gemini' ? 'default' : 'outline'} onClick={() => setPreferredProvider('gemini')}>Gemini</Button>
                                        <Button type="button" variant={preferredProvider === 'xai' ? 'default' : 'outline'} onClick={() => setPreferredProvider('xai')}>xAI</Button>
                                        <Button type="button" variant={preferredProvider === 'openai' ? 'default' : 'outline'} onClick={() => setPreferredProvider('openai')}>OpenAI</Button>
                                        <Button type="button" variant={preferredProvider === 'anthropic' ? 'default' : 'outline'} onClick={() => setPreferredProvider('anthropic')}>Anthropic</Button>
                                        <Button type="button" variant={preferredProvider === 'azure' ? 'default' : 'outline'} onClick={() => setPreferredProvider('azure')}>Azure</Button>
                                        <Button type="button" variant={preferredProvider === 'aws' ? 'default' : 'outline'} onClick={() => setPreferredProvider('aws')}>AWS</Button>
                                        <Button type="button" variant={preferredProvider === 'ollama' ? 'default' : 'outline'} onClick={() => setPreferredProvider('ollama')}>Ollama</Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSavingKeys}>
                                    {isSavingKeys && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save API Keys
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Delete Account
                            </CardTitle>
                            <CardDescription className="text-red-500/70">Permanently delete your account and all data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
