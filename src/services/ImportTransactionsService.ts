import { getCustomRepository, getRepository, In } from 'typeorm';
import path from 'path';
import csvParse from 'csv-parse';
import fs from 'fs';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionObj {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(FileName: string): Promise<Transaction[]> {
    const transactions: TransactionObj[] = [];
    const categories: string[] = [];

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const parseOptions = csvParse({
      from_line: 2
    });

    const stream = fs
      .createReadStream(path.join(uploadConfig.directory, FileName))
      .pipe(parseOptions);

    stream.on('data', async data => {
      const [title, type, value, category] = data.map((datum: string) =>
        datum.trim()
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => stream.on('end', resolve));

    const categoriesAlreadyinBD = await categoriesRepository.find({
      where: { title: In(categories) }
    });

    const categoriesAlreadyinBDtitles = await categoriesAlreadyinBD.map(
      (category: Category) => category.title
    );

    const categoriestoAdd = categories
      .filter(category => !categoriesAlreadyinBDtitles.includes(category))
      .filter((value, index, array) => array.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriestoAdd.map(title => ({
        title
      }))
    );

    await categoriesRepository.save(newCategories);

    const categoriesToConsider = [...newCategories, ...categoriesAlreadyinBD];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categoriesToConsider.find(
          category => category.title === transaction.title
        )
      }))
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(path.join(uploadConfig.directory, FileName));

    return newTransactions;
  }
}

export default ImportTransactionsService;
