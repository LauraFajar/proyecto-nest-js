import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SublotesService } from './sublotes.service';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';

@Controller('sublotes')
export class SublotesController {
  constructor(private readonly sublotesService: SublotesService) {}

  @Post()
  create(@Body() createSubloteDto: CreateSubloteDto) {
    return this.sublotesService.create(createSubloteDto);
  }

  @Get()
  findAll() {
    return this.sublotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sublotesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubloteDto: UpdateSubloteDto) {
    return this.sublotesService.update(+id, updateSubloteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sublotesService.remove(+id);
  }
}
