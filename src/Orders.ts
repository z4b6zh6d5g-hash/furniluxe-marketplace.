import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: () => true,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['orderNumber', 'customerName', 'total', 'status', 'createdAt'],
    group: 'Store',
    useAsTitle: 'orderNumber',
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      maxLength: 30,
    },
    {
      name: 'deliveryAddress',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 20,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          max: 20,
        },
        {
          name: 'productName',
          type: 'text',
          access: { create: () => false, update: () => false },
        },
        {
          name: 'unitPrice',
          type: 'number',
          access: { create: () => false, update: () => false },
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      access: { create: () => false, update: () => false },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'In delivery', value: 'in-delivery' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      access: { create: () => false },
    },
    {
      name: 'customerNote',
      type: 'textarea',
      maxLength: 500,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data?.items) return data

        const safeItems = []
        let total = 0

        for (const item of data.items) {
          const productID = typeof item.product === 'object' ? item.product?.id : item.product
          const quantity = Math.max(1, Math.min(20, Number(item.quantity) || 1))
          const product = await req.payload.findByID({
            collection: 'products',
            id: productID,
            overrideAccess: false,
          })

          if (!product.isActive || product.stock < quantity) {
            throw new Error(`${product.name} is not available in the requested quantity.`)
          }

          const unitPrice = product.salePrice || product.price
          total += unitPrice * quantity
          safeItems.push({
            product: product.id,
            productName: product.name,
            quantity,
            unitPrice,
          })
        }

        return {
          ...data,
          items: safeItems,
          orderNumber: `FL-${Date.now().toString(36).toUpperCase()}`,
          status: 'pending',
          total,
        }
      },
    ],
  },
  timestamps: true,
  versions: false,
}
