import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, HardDrive, Wifi } from 'lucide-react';

export default function CapacityCalculator() {
    const [dau, setDau] = useState(100); // millions
    const [uploadsPerUser, setUploadsPerUser] = useState(0.01); // 1% of users upload
    const [avgSize, setAvgSize] = useState(500); // MB
    const [replication, setReplication] = useState(3);

    const dailyUploads = dau * 1000000 * uploadsPerUser;
    const dailyStorageMB = dailyUploads * avgSize;
    const dailyStoragePB = dailyStorageMB / (1024 * 1024 * 1024); // PB
    const totalStoragePB = dailyStoragePB * replication;

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="p-6 border-2 border-primary/20 bg-background/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                    <Calculator className="h-5 w-5" />
                    Capacity Planning Assistant
                </h3>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</span>
                            Assumptions
                        </h4>

                        <div className="grid gap-3">
                            <div>
                                <Label>DAU (Millions)</Label>
                                <Input
                                    type="number"
                                    value={dau}
                                    onChange={(e) => setDau(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Upload Ratio (per user/day)</Label>
                                <Input
                                    type="number"
                                    value={uploadsPerUser}
                                    onChange={(e) => setUploadsPerUser(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Avg Video Size (MB)</Label>
                                <Input
                                    type="number"
                                    value={avgSize}
                                    onChange={(e) => setAvgSize(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Replication Factor</Label>
                                <Input
                                    type="number"
                                    value={replication}
                                    onChange={(e) => setReplication(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</span>
                            Estimates
                        </h4>

                        <Card className="p-4 bg-primary/5 border-primary/20 space-y-4">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <HardDrive className="h-3 w-3" /> Daily New Storage
                                </div>
                                <div className="text-2xl font-bold font-mono">
                                    {dailyStoragePB.toFixed(2)} PB
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    (Includes {replication}x replication)
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Wifi className="h-3 w-3" /> Ingress Bandwidth
                                </div>
                                <div className="text-2xl font-bold font-mono">
                                    {((dailyStorageMB * 8) / (24 * 60 * 60)).toFixed(2)} Mbps
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    (Average per second)
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>
        </div>
    );
}
