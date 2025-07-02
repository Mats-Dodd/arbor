"use client"

import { Home, Search, Settings, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarFooter
} from './sidebar';
import FileUploadDialog from './file-upload-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";

// Dynamically import FileTree to prevent SSR issues
const FileTree = dynamic(() => import('./file-tree'), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-24 ml-4" />
      <Skeleton className="h-5 w-28 ml-4" />
      <Skeleton className="h-5 w-20 ml-4" />
    </div>
  )
});

export function AppSidebar() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [collectionData, setCollectionData] = useState<{
    name: string;
    nodes: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Move fetchLatestCollection outside of useEffect so it can be called elsewhere
  const fetchLatestCollection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/collections/latest');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Latest collection:', data);
      
      // Handle null response (no collections exist)
      if (!data) {
        console.log('No collections found');
        setCollectionData(null);
        return;
      }
      
      // Set the collection data
      setCollectionData({
        name: data.name,
        nodes: data.nodes || []
      });
      
      // Log all nodes in the collection
      if (data.nodes && data.nodes.length > 0) {
        console.log(`Found ${data.nodes.length} nodes in collection "${data.name}":`);
        data.nodes.forEach((node: any, index: number) => {
          console.log(`Node ${index + 1}:`, {
            id: node.id,
            name: node.name,
            kind: node.kind,
            parentId: node.parentId,
            metadata: node.metadata,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt
          });
        });
      } else {
        console.log('No nodes found in collection');
      }
    } catch (error) {
      console.error('Failed to fetch latest collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the latest collection on mount
    fetchLatestCollection();
  }, []);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5 transition-[gap] duration-300 ease-in-out group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              A
            </div>
            <span className="truncate font-semibold opacity-100 transition-opacity duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
              Arbor
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Search">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>File Tree</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-24 ml-4" />
                    <Skeleton className="h-5 w-28 ml-4" />
                    <Skeleton className="h-5 w-20 ml-4" />
                  </div>
                ) : collectionData === null ? (
                  <div className="text-sm text-muted-foreground px-2">
                    No collections found
                  </div>
                ) : (
                  <FileTree 
                    nodes={collectionData?.nodes || []} 
                    collectionName={collectionData?.name || 'Collection'} 
                  />
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Upload"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </SidebarMenuButton>
              <SidebarMenuButton tooltip="Settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Drag and drop files or click to browse. You can upload multiple files at once.
            </DialogDescription>
          </DialogHeader>
          <FileUploadDialog onImportSuccess={() => {
            fetchLatestCollection();
            setUploadDialogOpen(false);
          }} />
        </DialogContent>
      </Dialog>
    </>
  );
} 