import { Building2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@/lib/local-auth";

interface Props {
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelectScreen({ onSelectRole }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 slide-up">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">TaskFlow</h1>
          <p className="text-muted-foreground">How would you like to use TaskFlow?</p>
        </div>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onSelectRole("manager")}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="rounded-lg bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">I'm a Manager</CardTitle>
                <CardDescription>Create offices, manage teams & assign tasks</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1 ml-1">
                <li>• Create office rooms with unique codes</li>
                <li>• View employee online/offline status</li>
                <li>• Assign tasks with deadlines to employees</li>
                <li>• Personal task management + AI assistant</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onSelectRole("employee")}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">I'm an Employee</CardTitle>
                <CardDescription>Join an office & view assigned tasks</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1 ml-1">
                <li>• Join your manager's office with a code</li>
                <li>• View and complete assigned tasks</li>
                <li>• Track your task progress</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
