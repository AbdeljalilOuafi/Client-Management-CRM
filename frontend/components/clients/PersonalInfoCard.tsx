import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/api/clients";

interface PersonalInfoCardProps {
  client: Client;
  isEditing: boolean;
  editedClient: Client | null;
  onFieldUpdate: (field: string, value: any) => void;
}

export function PersonalInfoCard({ client, isEditing, editedClient, onFieldUpdate }: PersonalInfoCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.first_name}
              onChange={(e) => onFieldUpdate("first_name", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.first_name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.last_name}
              onChange={(e) => onFieldUpdate("last_name", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.last_name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Client ID</Label>
          <p className="font-mono font-semibold text-primary py-2 px-3 bg-primary/5 rounded-md border border-primary/20">{client.id}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
          {isEditing && editedClient ? (
            <Input
              type="email"
              value={editedClient.email}
              onChange={(e) => onFieldUpdate("email", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">{client.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.phone || ""}
              onChange={(e) => onFieldUpdate("phone", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.phone || "-"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
          {isEditing && editedClient ? (
            <Input
              type="date"
              value={editedClient.dob || ""}
              onChange={(e) => onFieldUpdate("dob", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.dob || "-"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
          {isEditing && editedClient ? (
            <Select
              value={editedClient.gender || ""}
              onValueChange={(value) => onFieldUpdate("gender", value)}
            >
              <SelectTrigger className="transition-all hover:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.gender || "-"}</p>
          )}
        </div>
        <div className="col-span-2 space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Address</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.address || ""}
              onChange={(e) => onFieldUpdate("address", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.address || "-"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Instagram</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.instagram_handle || ""}
              onChange={(e) => onFieldUpdate("instagram_handle", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.instagram_handle || "-"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Country</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.country || ""}
              onChange={(e) => onFieldUpdate("country", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.country || "-"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">State</Label>
          {isEditing && editedClient ? (
            <Input
              value={editedClient.state || ""}
              onChange={(e) => onFieldUpdate("state", e.target.value)}
              className="transition-all hover:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.state || "-"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
