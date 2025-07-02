"use client"

import { Home, Search, Settings, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import FileTree from './file-tree';
import FileUploadDialog from './file-upload-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";

export function AppSidebar() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch the latest collection
    const fetchLatestCollection = async () => {
      try {
        const response = await fetch('/api/collections/latest');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Latest collection:', data);
        
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
      }
    };

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
                <FileTree />
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
          <FileUploadDialog />
        </DialogContent>
      </Dialog>
    </>
  );
} 