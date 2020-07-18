// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  async getCategory(title: string): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { title }
    });

    if (!category) {
      const newCategory = categoryRepository.create({ title });

      await categoryRepository.save(newCategory);

      return newCategory;
    }
    return category;
  }

  public async execute({
    title,
    value,
    type,
    category
  }: Request): Promise<Transaction> {
    const categoryWithGivenTitle = await this.getCategory(category);

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const currentBalance = await transactionsRepository.getBalance();

    if (type === 'outcome' && currentBalance.total < value)
      throw new AppError('Não tem saldo');

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryWithGivenTitle.id
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
