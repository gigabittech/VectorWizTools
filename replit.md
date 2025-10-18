# VectorWiz Portal

## Overview

VectorWiz Portal is a full-stack web application for professional vector conversion services. The application provides a comprehensive platform for clients to upload images, place orders for vector conversion services, track progress, and manage files. It features real-time messaging, PayPal payment integration, and professional tools for image analysis and project estimation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React Context for auth/WebSocket
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Authentication**: JWT-based auth with httpOnly cookies (access + refresh token pattern)
- **Real-time Communication**: WebSocket server for order updates and messaging
- **File Upload**: Direct-to-cloud upload with presigned URLs pattern
- **API Design**: RESTful endpoints with TypeScript interfaces

### Database & Storage
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM with schema-first approach and type safety
- **File Storage**: Google Cloud Storage with ACL-based access control
- **Schema**: Comprehensive relational design covering users, orders, files, messages, proofs, and sessions

### Authentication & Authorization
- **Strategy**: JWT with dual-token pattern (short-lived access, long-lived refresh)
- **Storage**: httpOnly cookies for security
- **Session Management**: Database-backed sessions with refresh token rotation
- **Password Security**: bcrypt hashing with salt rounds
- **Role-based Access**: CLIENT, ADMIN, DESIGNER roles with middleware enforcement

### Payment Processing
- **Provider**: PayPal SDK integration with sandbox/production environment detection
- **Flow**: Order creation → client approval → server-side capture
- **Security**: Server-side validation of all payment operations

### File Management System
- **Upload Strategy**: Client-side upload with presigned URLs for direct-to-cloud transfer
- **File Types**: Support for raster (images) and vector formats with automatic detection
- **Access Control**: Custom ACL system with group-based permissions
- **File Organization**: Categorized by type (SOURCE, UPLOAD, PROOF, FINAL)

### Real-time Features
- **WebSocket Integration**: Live order updates and messaging
- **Subscription Management**: Order-specific subscriptions with automatic reconnection
- **Event Broadcasting**: Server-side message broadcasting to relevant clients

### Development Tools & Workflow
- **Build System**: Vite with TypeScript support and hot module replacement
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Experience**: Replit-optimized with cartographer and dev banner plugins

### Shared Type System
- **Schema Definition**: Centralized Drizzle schema with Zod validation
- **Type Generation**: Automatic TypeScript types from database schema
- **Validation**: Runtime validation with createInsertSchema pattern
- **Code Sharing**: Shared types between client and server via TypeScript path mapping

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Google Cloud Storage**: Object storage with ACL management
- **PayPal**: Payment processing with server SDK

### UI & Component Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

### Development & Build Tools
- **Vite**: Fast build tool with TypeScript and React support
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL adapter
- **TanStack Query**: Server state management with caching and synchronization

### File Upload Infrastructure
- **Uppy**: File upload library with dashboard UI and direct-to-cloud capabilities
- **WebSocket (ws)**: Real-time communication for live updates

### Authentication & Security
- **jsonwebtoken**: JWT implementation for stateless authentication
- **bcryptjs**: Password hashing with configurable salt rounds
- **cookie-parser**: HTTP cookie parsing middleware

## Tools Platform Development (October 2025)

### Tools Architecture
The VectorWiz Tools Platform provides 100+ free image and PDF tools with professional quality and SEO optimization.

**Foundation Components (Phase 1):**
- `ToolLayout`: Standardized layout with SEO metadata, structured data (SoftwareApplication schema), breadcrumbs, and HowTo schemas
- `FileUploader`: Drag-and-drop file upload with validation, preview, and multi-file support
- `ProcessingIndicator`: Status feedback for processing operations (idle, processing, success, error)
- `DownloadButton`: Standardized download interface with loading states
- **SEO Helpers** (`lib/seoHelpers.ts`): generateToolMetadata, generateSoftwareApplicationSchema, generateHowToSchema
- **Image Processing Library** (`lib/imageProcessing.ts`): Core image manipulation functions
- **File Utilities** (`lib/fileUtils.ts`): File operations and format detection

**Completed Tools:**

**Phase 2 - Simple High-Value Tools:**
1. **Image Resizer** (`/tools/image-resizer`): Dimension adjustment with aspect ratio lock, quick presets (Instagram, Facebook, Twitter, HD), real-time preview
2. **Image Compressor** (`/tools/image-compressor`): Quality slider with compression stats, before/after comparison, format support (JPG, PNG, WebP)
3. **Image Cropper** (`/tools/image-cropper`): Custom crop dimensions with X/Y positioning, aspect ratio presets (1:1, 4:5, 16:9, 4:3)
4. **Image Rotator** (`/tools/image-rotator`): 90°/180°/270° rotation, horizontal/vertical flip operations

**Phase 3 - Medium Complexity Tools:**
5. **Image Filter & Effects** (`/tools/image-filter`): Brightness, contrast, saturation sliders (0-200%), blur effects (0-20px), grayscale/sepia/invert toggles, quick presets (Vintage, B&W, High Contrast, Soft Blur)
6. **Image Format Converter** (`/tools/format-converter`): Comprehensive format support (PNG, JPG, WebP, GIF, BMP), quality controls for lossy formats, quick conversion presets, format-specific notes

**Phase 4 - Advanced Tools:**
7. **Image Watermark Tool** (`/tools/image-watermark`): Text AND image watermarks with position control, customizable font/color/opacity/rotation for text mode, logo upload with scale control for image mode, dual-mode support with shared position/opacity controls
8. **Image Border/Frame Tool** (`/tools/image-border`): Custom borders with width control (1-100px), color picker with presets, inner padding adjustment, shadow effects with blur control, quick presets (Classic White, Bold Black, Gallery Frame, Modern Minimal)
9. **Color Palette Extractor** (`/tools/color-palette-extractor`): Extract 3-10 dominant colors from images, display hex and RGB values, one-click copy to clipboard, palette preview bar, export formats (CSS array, Tailwind colors), interactive color swatches
10. **Image to Base64 Converter** (`/tools/image-to-base64`): Convert images to Base64 strings, multiple output formats (Plain, Data URL, CSS, HTML, Markdown), copy to clipboard, download as text file, file size comparison stats
11. **Image Comparison Tool** (`/tools/image-comparison`): Side-by-side comparison mode, interactive slider view with smooth transitions, dimension comparison, file size stats, swap images functionality, perfect for before/after showcases

**Phase 5 - Additional High-Value Tools:**
12. **Add Text to Image** (`/tools/add-text-to-image`): Multiple text layer support with add/remove, full text customization (font, size, color, position X/Y, alignment), text styling (bold, italic), background with opacity control, quick presets (Bold Title, Subtitle, Caption), perfect for memes and social media graphics
13. **Make Round Image** (`/tools/make-round-image`): Create circular profile pictures with transparent backgrounds, customizable output size (100-2000px), optional border with color/width controls, size presets (400px, 800px, 1200px), auto-crops to fill circle, always outputs PNG format

**Design System:**
- Primary brand color: #06183C (dark navy)
- CTA color: #0B9F47 (green)
- Quote request form: Gradient background (linear-gradient(75deg, #06183C 0%, #20448B 100%))
- All tools include data-testid attributes for automated testing
- Responsive design with mobile-first approach

**SEO Strategy:**
- Individual pages for each tool for maximum SEO benefit
- SoftwareApplication structured data on every tool page
- HowTo schema with step-by-step instructions
- Open Graph tags for social sharing
- Semantic HTML with proper heading hierarchy
- Keywords and meta descriptions optimized per tool

**Tools Landing Page:**
- Located at root (`/`) with 100+ tools listed
- Category filtering (Image Tools, PDF Tools)
- Search functionality
- "Coming Soon" badges for tools in development
- Direct links to completed tools