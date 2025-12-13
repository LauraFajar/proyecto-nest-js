import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('inventario')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  create(@Body() createInventarioDto: any) {
    return this.inventarioService.create(createInventarioDto);
  }

  @Get()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'inventario', accion: 'ver' })
  findAll() {
    return this.inventarioService.findAll();
  }

  @Get('reporte')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'inventario', accion: 'ver' })
  async reporteInventario(@Query('stock_minimo') stock_minimo?: number) {
    return this.inventarioService.obtenerReporteInventario(stock_minimo);
  }

  @Get('stock-bajo')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'inventario', accion: 'ver' })
  async stockBajo(@Query('limite') limite?: number) {
    return this.inventarioService.obtenerStockBajo(limite || 10);
  }

  @Get('estadisticas')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'inventario', accion: 'ver' })
  async estadisticasInventario() {
    return this.inventarioService.obtenerEstadisticas();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'inventario', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.inventarioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInventarioDto: any) {
    return this.inventarioService.update(+id, updateInventarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventarioService.remove(+id);
  }
}
