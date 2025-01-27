import type React from "react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Book {
  title: string;
  author: string;
  categoryName: string;
  pubDate: string;
  toc?: string;
}

interface BookSearchResultProps {
  books: Book[];
}

export const BookSearchResult: React.FC<BookSearchResultProps> = ({
  books,
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedToc, setSelectedToc] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const toggleItem = (value: string) => {
    setExpandedItems((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const formatToc = (toc: string) => {
    return toc.split(/[<BR>\\n]+/).map((item, index) => (
      <p key={index} className="mb-1">
        {item.trim()}
      </p>
    ));
  };

  const openTocAlertDialog = (toc: string, title: string) => {
    setSelectedToc(toc);
    setSelectedTitle(title);
    setIsAlertDialogOpen(true);
  };

  return (
    <div className="space-y-4 w-full max-w-full mx-auto md:max-w-2xl">
      <h2 className="text-xl font-bold">검색 결과</h2>
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={setExpandedItems}
        className="w-full"
      >
        {books.map((book, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="px-2 sm:px-4 w-full"
          >
            <AccordionTrigger
              onClick={() => toggleItem(`item-${index}`)}
              className="w-full"
            >
              <div className="text-left w-full overflow-hidden">
                <h3 className="font-semibold text-sm sm:text-base break-words">
                  {book.title}
                </h3>
                <p className="text-xs sm:text-sm opacity-70 break-words">
                  {book.author.replace(" 지음", "")}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <p className="text-xs sm:text-sm break-words">
                  <strong>분류:</strong> {book.categoryName}
                </p>
                <p className="text-xs sm:text-sm break-words">
                  <strong>출판일:</strong> {book.pubDate}
                </p>
                {book.toc && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openTocAlertDialog(book.toc!, book.title)}
                  >
                    목차 보기
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              {selectedTitle} - 목차
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {selectedToc && formatToc(selectedToc)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
