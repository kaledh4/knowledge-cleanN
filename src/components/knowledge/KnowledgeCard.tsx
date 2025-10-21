'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import type { KnowledgeEntry, Tag } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import EntryDialog from './EntryDialog';
import ViewEntryDialog from './ViewEntryDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { cn } from '@/lib/utils';
import { useTagColors } from '@/hooks/useTagColors';

type KnowledgeCardProps = {
  entry: KnowledgeEntry;
  onUpdate: () => void;
  onDelete: () => void;
};


export default function KnowledgeCard({ entry, onUpdate, onDelete }: KnowledgeCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { getTagClasses, getCardBorderColor } = useTagColors();

  const Icon = entry.type === 'TEXT' ? FileText : LinkIcon;
  
  // Safely format the date with validation
  const getTimeAgo = () => {
    try {
      const date = new Date(entry.created_at);
      if (isNaN(date.getTime())) {
        return 'Unknown time';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  const timeAgo = getTimeAgo();

  const handleCardClick = () => {
    setIsViewDialogOpen(true);
  };

  return (
    <>
      <EntryDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen} 
        entry={entry}
        onSuccess={onUpdate}
      />
      <ViewEntryDialog 
        isOpen={isViewDialogOpen} 
        setIsOpen={setIsViewDialogOpen} 
        entry={entry}
      />
      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        entry={entry}
        onSuccess={onDelete}
      />
      <Card 
        className={cn(
          "flex h-full transform-gpu flex-col bg-card/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-primary/20 hover:shadow-lg cursor-pointer",
          getCardBorderColor(entry.tags[0] as Tag)
        )}
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-lg font-bold leading-tight line-clamp-2">
              {entry.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription className="flex items-center pt-1 text-xs text-muted-foreground">
            <Icon className="mr-2 h-3 w-3" />
            <span>Added {timeAgo}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-foreground/80 line-clamp-3">
            {entry.content}
          </p>
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <Badge key={tag} variant="outline" className={cn(getTagClasses(tag as Tag))}>
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
