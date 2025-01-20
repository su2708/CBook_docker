import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

export const BookSearchResult: React.FC<BookSearchResultProps> = ({ books }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">검색 결과</h2>
      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
        {books.map((book, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger onClick={() => toggleItem(`item-${index}`)}>
              <div className="text-left">
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm opacity-70">{book.author.replace(' 지음', '')}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p><strong>분류:</strong> {book.categoryName}</p>
                <p><strong>출판일:</strong> {book.pubDate}</p>
                {book.toc && (
                  <div>
                    <strong>목차:</strong>
                    <div className="mt-2 text-sm">{formatToc(book.toc)}</div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
