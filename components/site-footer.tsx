import Link from "next/link"
import { Scissors } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="col-span-1">
            <Link href="/" className="flex justify-center md:justify-start">
              <div className="w-60 h-48 ml-10">
                <img
                  src="/bg.jpg"
                  alt="Barbershop interior"
                  className="object-cover rounded w-full h-full"
                />
              </div>
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/book" className="text-muted-foreground hover:text-white">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/queue" className="text-muted-foreground hover:text-white">
                  Queue Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="font-medium mb-4 text-white">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-white">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-white">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="text-muted-foreground hover:text-white">
                  My Appointments
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-medium mb-4 text-white">Contact</h3>
            <ul className="space-y-2">
              <li className="text-muted-foreground">Poblacion Nabunturan, Davao de Oro</li>
              <li className="text-muted-foreground">Phone: (123) 456-7890</li>
              <li className="text-muted-foreground">Email: info@christiansbarbershop.com</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          Christian's Barbershop. All rights reserved. Established Since 2011
        </div>
      </div>
    </footer>
  )
}
