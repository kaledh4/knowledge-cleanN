'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';
import type { KnowledgeEntry } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn, getTagColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ViewEntryDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: KnowledgeEntry;
};

export default function ViewEntryDialog({ isOpen, setIsOpen, entry }: ViewEntryDialogProps) {
  const Icon = entry.type === 'TEXT' ? FileText : LinkIcon;

  // Function to detect if text is Arabic
  const isArabic = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text || '');
  };

  // Determine text direction based on content
  const textDirection = isArabic(entry.title) || isArabic(entry.content) ? 'rtl' : 'ltr';

  // Safely format the date with validation and proper timezone handling
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
  const { toast } = useToast();

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(entry.content || '');
      toast({
        title: 'Content Copied',
        description: 'The content has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy content to clipboard.',
      });
    }
  };

  const isLink = entry.type !== 'TEXT';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col" dir={textDirection}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className={cn(
            "font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary flex items-center gap-3",
            textDirection === 'rtl' && "flex-row-reverse text-right font-arabic"
          )}>
            <Icon className="h-7 w-7" />
            {entry.title || 'Untitled'}
          </DialogTitle>
          <DialogDescription className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground pt-2",
            textDirection === 'rtl' && "flex-row-reverse"
          )}>
            <span>Added {timeAgo}</span>
          </DialogDescription>
        </DialogHeader>

        <div className={cn(
          "flex-1 overflow-y-auto space-y-4",
          textDirection === 'rtl' ? "pl-2 pr-2" : "pr-2 pl-2"
        )}>
          {/* Content */}
          <div className="space-y-3">
            <div className={cn(
              "flex items-center justify-between",
              textDirection === 'rtl' && "flex-row-reverse"
            )}>
              <h4 className="text-base font-semibold text-foreground">Content</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyContent}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="rounded-lg border border-white/10 bg-card/40 backdrop-blur-sm p-5 max-h-96 overflow-y-auto">
              <p className={cn(
                "text-[15px] leading-loose text-foreground/95 whitespace-pre-wrap select-text",
                textDirection === 'rtl' && "text-right font-arabic"
              )}>
                {entry.content}
              </p>
            </div>
          </div>

          {/* URL if it's a link */}
          {isLink && entry.url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Source Link</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(entry.url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Link
                </Button>
                <span className="text-xs text-muted-foreground truncate select-text">
                  {entry.url}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-foreground">Tags</h4>
              <div className={cn(
                "flex flex-wrap gap-2.5",
                textDirection === 'rtl' && "justify-end"
              )}>
                {entry.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      getTagColor(tag),
                      "px-3.5 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default"
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}