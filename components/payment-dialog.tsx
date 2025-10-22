import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "react-accessible-aria"
import { Button, Label } from "react-accessible-aria"
import { useState } from "react"
import { toast } from "react-toastify"
import { serverTimestamp } from "firebase/firestore"

export function PaymentDialog({ open, onOpenChange, total, items }) {
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())

  const handleCompletePayment = async () => {
    if (!selectedBarber || !paymentMethod || !cashAmount) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const transaction = {
        items,
        total,
        barber: selectedBarber,
        paymentMethod,
        cashAmount: Number(cashAmount),
        date: transactionDate, // Use selected date
        createdAt: serverTimestamp(), // Keep track of when it was actually recorded
      }

      // ...existing transaction creation code...
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Failed to process payment")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>Complete the transaction.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Date Selector */}
          <div className="space-y-2">
            <Label>Transaction Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(transactionDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Existing payment form fields */}
          <div className="space-y-2">
            <Label>Select Barber</Label>
            {/* ...existing barber select... */}
          </div>

          {/* ...existing code... */}
        </div>
      </DialogContent>
    </Dialog>
  )
}