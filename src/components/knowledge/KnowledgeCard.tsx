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

  // Function to detect if text is Arabic
  const isArabic = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  };

  // Determine text direction based on content
  const textDirection = isArabic(entry.title) || isArabic(entry.content) ? 'rtl' : 'ltr';

  // Get the primary tag color for the vertical strap
  const getPrimaryTagColor = (tag: string): string => {
    if (tagColors[tag]) {
      const colors = tagColors[tag];
      // Extract the base color from the borderColor
      if (colors.borderColor.includes('red')) return '#ef4444';
      if (colors.borderColor.includes('blue')) return '#3b82f6';
      if (colors.borderColor.includes('green')) return '#22c55e';
      if (colors.borderColor.includes('yellow')) return '#eab308';
      if (colors.borderColor.includes('purple')) return '#a855f7';
      if (colors.borderColor.includes('pink')) return '#ec4899';
      if (colors.borderColor.includes('orange')) return '#f97316';
      if (colors.borderColor.includes('teal')) return '#14b8a6';
    }

    // Default colors for known tags
    switch (tag) {
      case 'Important': return '#ef4444';
      case 'To Do Research On': return '#eab308';
      case 'Learning': return '#3b82f6';
      case 'AI': return '#a855f7';
      case 'Investing': return '#22c55e';
      default: return '#64748b';
    }
  };

  const primaryTagColor = entry.tags[0] ? getPrimaryTagColor(entry.tags[0]) : '#64748b';

  const { getTagClasses, getCardBorderColor, tagColors } = useTagColors();

  const Icon = entry.type === 'TEXT' ? FileText : LinkIcon;
  
  // Safely format the date with validation and proper timezone handling
  const getTimeAgo = () => {
    try {
      // Parse the ISO string and create a proper UTC date
      const utcDate = new Date(entry.created_at);
      if (isNaN(utcDate.getTime())) {
        return 'Unknown time';
      }

      // Use the parsed date directly - formatDistanceToNow handles timezone conversion properly
      return formatDistanceToNow(utcDate, {
        addSuffix: true,
        includeSeconds: false
      });
    } catch (error) {
      console.error('Date formatting error:', error);
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
          "flex h-full transform-gpu flex-col bg-card/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-primary/20 hover:shadow-lg cursor-pointer relative overflow-hidden card-vertical-strap",
          getCardBorderColor(entry.tags[0] as Tag)
        )}
        onClick={handleCardClick}
        style={{
          '--tag-color': primaryTagColor,
          direction: textDirection
        } as React.CSSProperties}
      >
        <CardHeader>
          <div className={cn(
            "flex items-start justify-between",
            textDirection === 'rtl' && "flex-row-reverse"
          )}>
            <CardTitle className={cn(
              "font-headline text-lg font-bold leading-tight line-clamp-2",
              textDirection === 'rtl' && "text-right"
            )}>
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
          <CardDescription className={cn(
            "flex items-center pt-1 text-xs text-muted-foreground",
            textDirection === 'rtl' && "flex-row-reverse"
          )}>
            <Icon className={cn(
              "h-3 w-3",
              textDirection === 'rtl' ? "ml-2 mr-0" : "mr-2 ml-0"
            )} />
            <span>Added {timeAgo}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className={cn(
            "text-sm text-foreground/80 line-clamp-3",
            textDirection === 'rtl' && "text-right"
          )}>
            {entry.content}
          </p>
        </CardContent>
        <CardFooter>
          <div className={cn(
            "flex flex-wrap gap-2",
            textDirection === 'rtl' && "justify-end"
          )}>
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
