import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Save, Loader2 } from "lucide-react";
import { Client, updateClient } from "@/lib/api/clients";
import { getClientPaymentDetails, ClientDetailsResponse } from "@/lib/api/client-details";
import { useToast } from "@/hooks/use-toast";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { PackageInfoCard } from "./PackageInfoCard";
import { DatesTimelineCard } from "./DatesTimelineCard";
import { TeamSupportCard } from "./TeamSupportCard";
import { TechnicalInfoCard } from "./TechnicalInfoCard";
import { StatusChangeScheduleCard } from "./StatusChangeScheduleCard";
import { StatusChangeDialog } from "./StatusChangeDialog";

interface ClientDetailsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
}

export function ClientDetailsDialog({ client, open, onOpenChange, onClientUpdated }: ClientDetailsDialogProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [statusChangeType, setStatusChangeType] = useState<"stop" | "pause" | "package_change" | null>(null);
  const [detailedData, setDetailedData] = useState<ClientDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch detailed payment data when dialog opens
  useEffect(() => {
    if (open && client) {
      setLoadingDetails(true);
      getClientPaymentDetails(client.id)
        .then((data) => {
          setDetailedData(data);
        })
        .catch((error) => {
          console.error("Failed to fetch client payment details:", error);
          toast({
            title: "Warning",
            description: "Could not load detailed payment information",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [open, client, toast]);

  const handleEditClient = () => {
    if (client) {
      setEditedClient({ ...client });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedClient(null);
    setIsEditing(false);
  };

  const updateEditedField = (field: string, value: any) => {
    if (editedClient) {
      setEditedClient({ ...editedClient, [field]: value });
    }
  };

  const handleSaveClient = async () => {
    if (!editedClient) return;
    try {
      await updateClient(editedClient.id, editedClient);
      setIsEditing(false);
      onClientUpdated();
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const handleStatusChangeSelect = (type: "stop" | "pause" | "package_change") => {
    setStatusChangeType(type);
    setStatusChangeOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
      setEditedClient(null);
    }
    onOpenChange(open);
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center justify-between pr-12">
              <span>Client Details</span>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button 
                    onClick={handleEditClient} 
                    size="sm" 
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleSaveClient} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      onClick={handleCancelEdit} 
                      size="sm" 
                      variant="outline"
                      className="hover:bg-destructive hover:text-destructive-foreground transition-all"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading client details...</span>
              </div>
            ) : (
              <>
                <PersonalInfoCard
                  client={client}
                  isEditing={isEditing}
                  editedClient={editedClient}
                  onFieldUpdate={updateEditedField}
                />
                <PackageInfoCard 
                  client={client} 
                  detailedData={detailedData}
                />
                <DatesTimelineCard 
                  client={client}
                  detailedData={detailedData}
                />
                <TeamSupportCard 
                  client={client}
                  detailedData={detailedData}
                />
                <TechnicalInfoCard client={client} />
                <StatusChangeScheduleCard onStatusChangeSelect={handleStatusChangeSelect} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <StatusChangeDialog
        open={statusChangeOpen}
        onOpenChange={setStatusChangeOpen}
        type={statusChangeType}
      />
    </>
  );
}
