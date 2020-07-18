import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from '../services/CreateTransactionService';
import AppError from '../errors/AppError';
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactionsObject = {
    transactions: await transactionsRepository.find(),
    balance: await transactionsRepository.getBalance()
  };

  return response.json(transactionsObject);
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  if (!id) throw new AppError('Transaction id not provided');

  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const deleteTransaction = await transactionsRepository.delete(id);

  if (deleteTransaction.affected === 0)
    throw new AppError('Transaction id does not exist');

  return response.status(204).json({});
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const fileName = request.file.filename;

    const importFromTransaction = new ImportTransactionsService();

    const transactions = await importFromTransaction.execute(fileName);

    return response.json(transactions);
  }
);

export default transactionsRouter;
