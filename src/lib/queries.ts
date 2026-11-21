import { queryOptions } from "@tanstack/react-query";
import {
  getSiteMeta,
  listAnnouncements,
  listOpenPositions,
  listTeamMembers,
} from "./public.functions";

export const siteMetaQuery = queryOptions({
  queryKey: ["site-meta"],
  queryFn: () => getSiteMeta(),
  staleTime: 60_000,
});

export const teamMembersQuery = queryOptions({
  queryKey: ["team-members"],
  queryFn: () => listTeamMembers(),
  staleTime: 60_000,
});

export const announcementsQuery = (limit = 50) =>
  queryOptions({
    queryKey: ["announcements", limit],
    queryFn: () => listAnnouncements({ data: { limit } }),
    staleTime: 30_000,
  });

export const openPositionsQuery = queryOptions({
  queryKey: ["open-positions"],
  queryFn: () => listOpenPositions(),
  staleTime: 30_000,
});
