import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, MoreVertical, Mail, Shield, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

async function getTeams(userId: string) {
  return db.team.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          apiKeys: true,
        },
      },
    },
  });
}

const roleColors: Record<string, string> = {
  OWNER: "bg-purple-500",
  ADMIN: "bg-blue-500",
  MEMBER: "bg-green-500",
  VIEWER: "bg-gray-500",
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const teams = await getTeams(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and collaborate with others
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams List */}
      {teams.length > 0 ? (
        <div className="space-y-6">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.description || "No description"}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {team.members.length} members
                    </Badge>
                    <Badge variant="outline">
                      {team._count.apiKeys} keys
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Team Members</h4>
                  <div className="grid gap-3">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>
                              {member.user.name ? getInitials(member.user.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${roleColors[member.role]} text-white`}
                          >
                            {member.role}
                          </Badge>
                          {member.userId !== session.user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Create a team to collaborate with others and share API keys securely.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
