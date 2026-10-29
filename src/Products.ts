import type { Access, CollectionConfig } from 'payload'

const isAdmin = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'admins'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => (req.user?.collection === 'admins' ? true : { isActive: { equals: true } }),
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'category', 'price', 'stock', 'isFeatured', 'isActive'],
    group: 'Store',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Used in the public product URL, for example: lagos-lounge-chair',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Price in Nigerian Naira (₦)', width: '50%' },
        },
        {
          name: 'salePrice',
          type: 'number',
          min: 0,
          admin: { description: 'Optional promotional price in Naira (₦)', width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Living Room', value: 'living-room' },
            { label: 'Bedroom', value: 'bedroom' },
            { label: 'Dining', value: 'dining' },
            { label: 'Office', value: 'office' },
            { label: 'Outdoor', value: 'outdoor' },
            { label: 'Lighting', value: 'lighting' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'stock',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      maxRows: 5,
    },
    {
      type: 'row',
      fields: [
        { name: 'material', type: 'text', admin: { width: '50%' } },
        { name: 'dimensions', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isFeatured',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '50%' },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Only active products are visible on the storefront.',
            width: '50%',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc }) => {
        const { revalidateTag } = await import('next/cache')
        revalidateTag('products', 'max')
        revalidateTag(`product:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`product:${previousDoc.slug}`, 'max')
        }
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        const { revalidateTag } = await import('next/cache')
        revalidateTag('products', 'max')
        revalidateTag(`product:${doc.slug}`, 'max')
      },
    ],
  },
  versions: false,
}
