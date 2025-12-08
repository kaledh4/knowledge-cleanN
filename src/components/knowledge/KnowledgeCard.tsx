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
import type { KnowledgeEntry } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import EntryDialog from './EntryDialog';
import ViewEntryDialog from './ViewEntryDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { cn } from '@/lib/utils';
import { TagColor } from '@/lib/tagService';
import { getTagColorClasses, getCardBorderColor } from '@/lib/tag-utils';

type KnowledgeCardProps = {
  entry: KnowledgeEntry;
  onUpdate: () => void;
  onDelete: () => void;
  tagColors?: Record<string, TagColor>;
};

export default function KnowledgeCard({ entry, onUpdate, onDelete, tagColors = {} }: KnowledgeCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Function to detect if text is Arabic
  const isArabic = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text || '');
  };

  // Determine text direction based on content
  const textDirection = isArabic(entry.title) || isArabic(entry.content) ? 'rtl' : 'ltr';

  const Icon = entry.type === 'TEXT' ? FileText : LinkIcon;

  const getTimeAgo = () => {
    try {
      const utcDate = new Date(entry.created_at);
      if (isNaN(utcDate.getTime())) return 'Unknown time';
      return formatDistanceToNow(utcDate, { addSuffix: true, includeSeconds: false });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const timeAgo = getTimeAgo();

  const handleCardClick = () => {
    setIsViewDialogOpen(true);
  };

  const firstTag = entry.tags && entry.tags.length > 0 ? entry.tags[0] : undefined;
  const borderClass = getCardBorderColor(firstTag, tagColors);

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
          "glass-card flex h-full transform-gpu flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-cyan-500/20 hover:shadow-lg cursor-pointer relative overflow-hidden p-1",
          borderClass
        )}
        onClick={handleCardClick}
        style={{ direction: textDirection } as React.CSSProperties}
      >
        <CardHeader className="pb-3">
          <div className={cn(
            "flex items-start justify-between gap-3",
            textDirection === 'rtl' && "flex-row-reverse"
          )}>
            <CardTitle className={cn(
              "font-headline text-xl font-bold leading-tight line-clamp-2 tracking-tight",
              textDirection === 'rtl' && "text-right font-arabic"
            )}>
              {entry.title || 'Untitled'}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover:bg-white/10"
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
            "flex items-center pt-1.5 text-xs text-muted-foreground",
            textDirection === 'rtl' && "flex-row-reverse"
          )}>
            <Icon className={cn(
              "h-3.5 w-3.5",
              textDirection === 'rtl' ? "ml-2 mr-0" : "mr-2 ml-0"
            )} />
            <span>Added {timeAgo}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pb-3">
          <p className={cn(
            "text-[15px] leading-relaxed text-foreground/90 line-clamp-3",
            textDirection === 'rtl' && "text-right font-arabic"
          )}>
            {entry.content}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <div className={cn(
            "flex flex-wrap gap-2",
            textDirection === 'rtl' && "justify-end"
          )}>
            {(entry.tags || []).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  getTagColorClasses(tag, tagColors),
                  "px-3 py-1 text-xs transition-all duration-200 hover:scale-105 cursor-default"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
