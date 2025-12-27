"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AvatarStack = () => {
  const users = [
    { name: "Sophie Martin", image: "/avatars/avatar-15.jpg" },
    { name: "Leo Anderson", image: "/avatars/avatar-16.jpg" },
    { name: "Chloe Thompson", image: "/avatars/avatar-17.jpg" },
    { name: "Max Rodriguez", image: "/avatars/avatar-18.jpg" },
    { name: "Zoe Garcia", image: "/avatars/avatar-19.jpg" },
    { name: "Additional Users", count: 123 },
  ];

  return (
    <div className="flex items-center -space-x-2 *:ring-3 *:ring-[#020513]">
      {users.slice(0, 4).map((user, index) => (
        <Avatar key={index} className="size-10 text-[13px]">
          <AvatarImage src={user.image} alt={user.name} />

          <AvatarFallback className="text-black">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}

      {users.length > 4 && (
        <Avatar className="z-10 text-xs font-medium text-muted-foreground size-10">
          <AvatarFallback>
            +{users.slice(4).reduce((acc, user) => acc + (user.count || 1), 0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default AvatarStack;
