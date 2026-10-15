const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Item price snapshot is required'],
      min: [0, 'Item price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    addressLine: {
      type: String,
      trim: true,
    },
    addressLine1: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED',
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING_PAYMENT',
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save hook to synchronize user/customer and address fields
orderSchema.pre('validate', function (next) {
  if (this.customer && !this.user) {
    this.user = this.customer;
  } else if (this.user && !this.customer) {
    this.customer = this.user;
  }

  if (this.shippingAddress) {
    if (this.shippingAddress.addressLine && !this.shippingAddress.addressLine1) {
      this.shippingAddress.addressLine1 = this.shippingAddress.addressLine;
    } else if (this.shippingAddress.addressLine1 && !this.shippingAddress.addressLine) {
      this.shippingAddress.addressLine = this.shippingAddress.addressLine1;
    }

    if (this.shippingAddress.postalCode && !this.shippingAddress.pincode) {
      this.shippingAddress.pincode = this.shippingAddress.postalCode;
    } else if (this.shippingAddress.pincode && !this.shippingAddress.postalCode) {
      this.shippingAddress.postalCode = this.shippingAddress.pincode;
    }
  }

  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
