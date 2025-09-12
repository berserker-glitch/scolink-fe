import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Building2, Users, Phone, Mail, MapPin, Plus } from 'lucide-react';
import { Center, User, apiService } from '@/services/api';

interface CenterDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: Center | null;
  onAddAdmin: () => void;
}

export const CenterDetailsModal: React.FC<CenterDetailsModalProps> = ({
  open,
  onOpenChange,
  center,
  onAddAdmin,
}) => {
  const [centerWithAdmins, setCenterWithAdmins] = useState<(Center & { admins: User[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (center && open) {
      loadCenterDetails();
    }
  }, [center, open]);

  const loadCenterDetails = async () => {
    if (!center) return;

    try {
      setLoading(true);
      const details = await apiService.getCenterWithAdmins(center.id);
      setCenterWithAdmins(details);
    } catch (error) {
      console.error('Error loading center details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!center) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {center.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Center Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">{center.location}</p>
                  </div>
                </div>

                {center.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{center.email}</p>
                    </div>
                  </div>
                )}

                {center.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">{center.phoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {centerWithAdmins?.admins.length || 0} admins
                  </Badge>
                  <Badge variant="secondary">
                    Created {new Date(center.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admins Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Center Admins
              </h3>
              <Button
                onClick={onAddAdmin}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : centerWithAdmins?.admins.length ? (
              <div className="space-y-3">
                {centerWithAdmins.admins.map((admin) => (
                  <Card key={admin.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{admin.fullName}</h4>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          {admin.phoneNumber && (
                            <p className="text-sm text-gray-500">{admin.phoneNumber}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={admin.isActive ? 'default' : 'destructive'}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No admins assigned to this center yet</p>
                  <Button
                    onClick={onAddAdmin}
                    size="sm"
                    className="mt-3 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Admin
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
