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