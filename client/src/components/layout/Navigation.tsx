import { Link, useLocation } from "wouter";
import { Button, Drawer, Stack, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Menu as MenuIcon, FileText } from "lucide-react";
import { useState } from "react";
import QuoteRequestForm from "../QuoteRequestForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Navigation() {
  const [location] = useLocation();
  const [opened, { open, close }] = useDisclosure(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location === href || location.startsWith(href);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur-lg bg-[#06183C]/95 border-b border-white/10 shadow-lg"
        data-testid="main-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center" data-testid="logo-link">
                <img
                  src="https://vectorwiz.com/wp-content/uploads/2023/02/VectorWiz-New-Logo-04.svg"
                  alt="VectorWiz"
                  className="h-10"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                <a
                  href="https://vectorwiz.com/"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-home"
                >
                  Home
                </a>
                <a
                  href="https://vectorwiz.com/services"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-services"
                >
                  Services
                </a>
                <Link
                  href="/"
                  className={`transition-colors text-sm font-medium ${
                    isActive("/")
                      ? "text-[#0B9F47]"
                      : "text-white/90 hover:text-white"
                  }`}
                  data-testid="nav-tools"
                >
                  Tools
                </Link>
                <a
                  href="https://vectorwiz.com/contact/"
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                  data-testid="nav-contact"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Request Quote Button with Glassmorphism */}
              <button
                onClick={() => setQuoteDialogOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white font-medium transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
                data-testid="request-quote-button"
              >
                <FileText className="h-4 w-4" />
                Request Quote
              </button>

              {/* Mobile Menu Button */}
              <Button
                variant="subtle"
                className="md:hidden text-white"
                onClick={open}
                data-testid="mobile-menu-button"
                size="sm"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group>
            <img
              src="https://vectorwiz.com/wp-content/uploads/2023/02/VectorWiz-New-Logo-04.svg"
              alt="VectorWiz"
              className="h-8"
            />
          </Group>
        }
        size="xs"
        data-testid="mobile-navigation-drawer"
      >
        <Stack gap="sm">
          <a
            href="https://vectorwiz.com/"
            className="block px-4 py-2 text-foreground hover:bg-muted rounded transition-colors"
            data-testid="mobile-nav-home"
          >
            Home
          </a>
          <a
            href="https://vectorwiz.com/services"
            className="block px-4 py-2 text-foreground hover:bg-muted rounded transition-colors"
            data-testid="mobile-nav-services"
          >
            Services
          </a>
          <Link href="/" onClick={close}>
            <Button
              variant={isActive("/") ? "filled" : "subtle"}
              fullWidth
              justify="flex-start"
              data-testid="mobile-nav-tools"
            >
              Tools
            </Button>
          </Link>
          <a
            href="https://vectorwiz.com/contact/"
            className="block px-4 py-2 text-foreground hover:bg-muted rounded transition-colors"
            data-testid="mobile-nav-contact"
          >
            Contact
          </a>

          <Button
            onClick={() => {
              close();
              setQuoteDialogOpen(true);
            }}
            className="bg-[#0B9F47] hover:bg-[#0B9F47]/90 text-white mt-4"
            fullWidth
            leftSection={<FileText className="h-4 w-4" />}
            data-testid="mobile-request-quote-button"
          >
            Request Quote
          </Button>
        </Stack>
      </Drawer>

      {/* Quote Request Dialog with Glassmorphism */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto text-white border-white/20 backdrop-blur-xl shadow-2xl"
          style={{
            background: "linear-gradient(75deg, rgba(6, 24, 60, 0.95) 0%, rgba(32, 68, 139, 0.95) 100%)"
          }}
        >
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export the hook for other components to use
export function useQuoteDialog() {
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  
  return {
    openQuoteDialog: () => setQuoteDialogOpen(true),
    closeQuoteDialog: () => setQuoteDialogOpen(false),
    QuoteDialog: () => (
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto text-white border-white/20 backdrop-blur-xl shadow-2xl"
          style={{
            background: "linear-gradient(75deg, rgba(6, 24, 60, 0.95) 0%, rgba(32, 68, 139, 0.95) 100%)"
          }}
        >
          <QuoteRequestForm />
        </DialogContent>
      </Dialog>
    ),
  };
}
