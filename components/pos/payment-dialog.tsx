import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onConfirmPayment: (payment: { amount: number; date: Date; change: number }) => void
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  total, 
  onConfirmPayment 
}: PaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("")
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const handleConfirm = () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount)) return

    onConfirmPayment({
      amount,
      date: new Date(transactionDate), // Pass the selected date
      change: amount - total
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>Enter payment amount to complete transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Transaction Date</Label>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")} // Prevent future dates
            />
          </div>

          <div className="space-y-2">
            <Label>Amount Due</Label>
            <div className="text-2xl font-bold">₱{total.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              min={total}
            />
          </div>

          {parseFloat(paymentAmount) > total && (
            <div className="space-y-2">
              <Label>Change</Label>
              <div className="text-xl font-semibold text-green-600">
                ₱{(parseFloat(paymentAmount) - total).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!paymentAmount || parseFloat(paymentAmount) < total}
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// In your POS page component
const handlePaymentConfirm = ({ amount, date, change }: { amount: number; date: Date; change: number }) => {
  // Use the date when creating the sale document
  const saleData = {
    // ...existing sale data...
    date: date, // Use the selected date
    total: amount,
    change: change,
    // ...other fields...
  }
  
  // Continue with your existing save logic
}