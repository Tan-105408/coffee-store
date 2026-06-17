BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'user',
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [googleId] NVARCHAR(1000),
    [address] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [image] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [Product_category_df] DEFAULT 'coffee',
    [discount] INT NOT NULL CONSTRAINT [Product_discount_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Cart] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cart_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cart_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CartItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cartId] INT NOT NULL,
    [productId] INT NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [CartItem_quantity_df] DEFAULT 1,
    CONSTRAINT [CartItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] INT NOT NULL IDENTITY(1,1),
    [token] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Review] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [productId] INT NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Review_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Review_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [totalAmount] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrderItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT NOT NULL,
    [productId] INT NOT NULL,
    [quantity] INT NOT NULL,
    [priceAtPurchase] FLOAT(53) NOT NULL,
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Cart] ADD CONSTRAINT [Cart_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_cartId_fkey] FOREIGN KEY ([cartId]) REFERENCES [dbo].[Cart]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
