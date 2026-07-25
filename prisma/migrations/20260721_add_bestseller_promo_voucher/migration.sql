-- Add columns to Product table
ALTER TABLE [dbo].[Product] ADD [bestSellerOverride] BIT NULL;
ALTER TABLE [dbo].[Product] ADD [bestSellerReason] NVARCHAR(500) NULL;

-- Create SiteSetting table
CREATE TABLE [dbo].[SiteSetting] (
    [id]    INT            IDENTITY(1,1) PRIMARY KEY,
    [key]   NVARCHAR(255)  NOT NULL,
    [value] NVARCHAR(MAX)  NOT NULL,
    CONSTRAINT [SiteSetting_key_key] UNIQUE ([key])
);

-- Create Promotion table (using NVARCHAR for enum types)
CREATE TABLE [dbo].[Promotion] (
    [id]           INT            IDENTITY(1,1) PRIMARY KEY,
    [name]         NVARCHAR(255)  NOT NULL,
    [type]         NVARCHAR(20)   NOT NULL, -- buyXGetY, percentOff, freeItem
    [buyQuantity]  INT            NULL,
    [getQuantity]  INT            NULL,
    [minQuantity]  INT            NULL,
    [discount]     FLOAT(53)      NULL,
    [freeProductId] INT            NULL,
    [isActive]     BIT            NOT NULL DEFAULT 1,
    [startDate]    DATETIME2(6)   NULL,
    [endDate]      DATETIME2(6)   NULL,
    [createdAt]    DATETIME2(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Voucher table (using NVARCHAR for enum types)
CREATE TABLE [dbo].[Voucher] (
    [id]            INT                         IDENTITY(1,1) PRIMARY KEY,
    [code]          NVARCHAR(100)               NOT NULL,
    [description]   NVARCHAR(500)               NULL,
    [discountType]  NVARCHAR(20)                NOT NULL, -- percent, fixed
    [discountValue] FLOAT(53)                   NOT NULL,
    [minOrderValue] FLOAT(53)                   NULL,
    [maxDiscount]   FLOAT(53)                   NULL,
    [usageLimit]    INT                         NULL,
    [usedCount]     INT                         NOT NULL DEFAULT 0,
    [isActive]      BIT                         NOT NULL DEFAULT 1,
    [expiresAt]     DATETIME2(6)                NULL,
    [createdAt]     DATETIME2(6)                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Voucher_code_key] UNIQUE ([code])
);

-- Create UserVoucher table
CREATE TABLE [dbo].[UserVoucher] (
    [id]        INT         IDENTITY(1,1) PRIMARY KEY,
    [userId]    INT         NOT NULL,
    [voucherId] INT         NOT NULL,
    [isUsed]    BIT         NOT NULL DEFAULT 0,
    [usedAt]    DATETIME2(6) NULL,
    [createdAt] DATETIME2(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserVoucher_userId_voucherId_key] UNIQUE ([userId], [voucherId])
);

-- Create VoucherRule table (using NVARCHAR for enum types)
CREATE TABLE [dbo].[VoucherRule] (
    [id]          INT                         IDENTITY(1,1) PRIMARY KEY,
    [name]        NVARCHAR(255)               NOT NULL,
    [triggerType] NVARCHAR(20)                NOT NULL, -- totalSpend, orderCount, specificProduct
    [threshold]   FLOAT(53)                   NOT NULL,
    [voucherId]   INT                         NOT NULL,
    [isActive]    BIT                         NOT NULL DEFAULT 1
);

-- Create indexes
CREATE INDEX [UserVoucher_userId_idx] ON [dbo].[UserVoucher]([userId]);
CREATE INDEX [UserVoucher_voucherId_idx] ON [dbo].[UserVoucher]([voucherId]);

-- Add foreign keys
ALTER TABLE [dbo].[UserVoucher] WITH CHECK ADD CONSTRAINT [FK_UserVoucher_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[UserVoucher] WITH CHECK ADD CONSTRAINT [FK_UserVoucher_Voucher] FOREIGN KEY ([voucherId]) REFERENCES [dbo].[Voucher]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[VoucherRule] WITH CHECK ADD CONSTRAINT [FK_VoucherRule_Voucher] FOREIGN KEY ([voucherId]) REFERENCES [dbo].[Voucher]([id]) ON DELETE CASCADE;

-- Enable foreign keys
ALTER TABLE [dbo].[UserVoucher] CHECK CONSTRAINT [FK_UserVoucher_User];
ALTER TABLE [dbo].[UserVoucher] CHECK CONSTRAINT [FK_UserVoucher_Voucher];
ALTER TABLE [dbo].[VoucherRule] CHECK CONSTRAINT [FK_VoucherRule_Voucher];
