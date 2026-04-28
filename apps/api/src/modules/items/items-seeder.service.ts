import { Injectable } from "@nestjs/common";
import { Prisma, ItemType } from "@prisma/client";

@Injectable()
export class ItemsSeederService {
  async seedDefaults(tx: Prisma.TransactionClient, companyId: string, coa: any, taxCodeId: string) {
    // 1. Seed Default Units
    const units = ["Pcs", "Box", "Kg", "Ltr", "Set"];
    await tx.unit.createMany({
      data: units.map((name) => ({ companyId, name })),
      skipDuplicates: true,
    });

    // 2. Seed Default Payment Methods
    await tx.paymentMethod.createMany({
      data: [
        { companyId, name: "Cash" },
        { companyId, name: "Bank Transfer" },
        { companyId, name: "Online Wallet" },
        { companyId, name: "Cheque" },
        { companyId, name: "Credit (Pay later)" },
      ],
      skipDuplicates: true,
    });

    // 3. Seed Default Sale Types
    await tx.saleType.createMany({
      data: [
        { companyId, name: "VAT 13% Sales" },
        { companyId, name: "Exempt Sales" },
        { companyId, name: "Export Sales" },
      ],
      skipDuplicates: true,
    });

    // 4. Seed Template Items
    const items = [
      { name: "General Service", type: ItemType.services, salesPrice: 0 },
      { name: "Standard Product", type: ItemType.goods, salesPrice: 0, unit: "Pcs" },
    ];

    for (const item of items) {
      await tx.item.create({
        data: {
          companyId,
          name: item.name,
          type: item.type,
          salesPrice: item.salesPrice,
          unit: item.unit,
          incomeAccountId: coa.sales.id,
          expenseAccountId: coa.cogs.id,
          taxCodeId: taxCodeId,
        },
      });
    }
  }
}
