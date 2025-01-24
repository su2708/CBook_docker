import type React from "react"
import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Button } from "./ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

interface Book {
  title: string
  author: string
  categoryName: string
  pubDate: string
  toc?: string
}

interface BookSearchResultProps {
  books: Book[]
}

export const BookSearchResult: React.FC<BookSearchResultProps> = ({ books }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [selectedToc, setSelectedToc] = useState<string | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

  const toggleItem = (value: string) => {
    setExpandedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const formatToc = (toc: string) => {
    return toc.split(/[<BR>\\n]+/).map((item, index) => (
      <p key={index} className="mb-1">
        {item.trim()}
      </p>
    ))
  }

  const openTocAlertDialog = (toc: string, title: string) => {
    setSelectedToc(toc)
    setSelectedTitle(title)
    setIsAlertDialogOpen(true)
  }

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold">검색 결과</h2>
      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
        {books.map((book, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="px-4 w-full">
            <AccordionTrigger onClick={() => toggleItem(`item-${index}`)} className="w-full">
              <div className="text-left w-full overflow-hidden">
                <h3 className="font-semibold truncate">{book.title}</h3>
                <p className="text-sm opacity-70 truncate">{book.author.replace(" 지음", "")}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 h-24 overflow-y-auto">
                <p className="truncate">
                  <strong>분류:</strong> {book.categoryName}
                </p>
                <p className="truncate">
                  <strong>출판일:</strong> {book.pubDate}
                </p>
                {book.toc && (
                  <Button variant="secondary" size="sm" onClick={() => openTocAlertDialog(book.toc!, book.title)}>
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
            <AlertDialogTitle>{selectedTitle} - 목차</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">{selectedToc && formatToc(selectedToc)}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
