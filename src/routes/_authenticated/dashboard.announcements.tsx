import { createFileRoute } from "@tanstack/react-router";
import { useAccess } from "@/hooks/use-auth";
import { NoAccess, PageTitle } from "@/components/dashboard/ui";
import { PostsManager } from "@/components/dashboard/PostsManager";

export const Route = createFileRoute("/_authenticated/dashboard/announcements")({
  component: () => {
    const { can } = useAccess();
    return (
      <div>
        <PageTitle title="Announcements" subtitle="Game news shown on the public Announcements page" />
        {can("CAN_POST_ANNOUNCEMENTS") ? <PostsManager table="announcements" noun="Announcement" /> : <NoAccess />}
      </div>
    );
  },
});
