import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Gestion_de_Productos', '0001_initial'),
        ('Gestion_de_Proveedores', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        'ALTER TABLE Gestion_de_Productos_producto_proveedores '
                        'RENAME TO producto_proveedor',
                        'ALTER TABLE producto_proveedor '
                        'RENAME COLUMN producto_id TO id_producto',
                        'ALTER TABLE producto_proveedor '
                        'RENAME COLUMN proveedor_id TO id_proveedor',
                    ),
                    reverse_sql=(
                        'ALTER TABLE producto_proveedor '
                        'RENAME COLUMN id_proveedor TO proveedor_id',
                        'ALTER TABLE producto_proveedor '
                        'RENAME COLUMN id_producto TO producto_id',
                        'ALTER TABLE producto_proveedor '
                        'RENAME TO Gestion_de_Productos_producto_proveedores',
                    ),
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='ProductoProveedor',
                    fields=[
                        (
                            'id',
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name='ID',
                            ),
                        ),
                        (
                            'producto',
                            models.ForeignKey(
                                db_column='id_producto',
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='relaciones_proveedor',
                                to='Gestion_de_Productos.producto',
                            ),
                        ),
                        (
                            'proveedor',
                            models.ForeignKey(
                                db_column='id_proveedor',
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name='relaciones_producto',
                                to='Gestion_de_Proveedores.proveedor',
                            ),
                        ),
                    ],
                    options={
                        'db_table': 'producto_proveedor',
                    },
                ),
                migrations.AlterField(
                    model_name='producto',
                    name='proveedores',
                    field=models.ManyToManyField(
                        blank=True,
                        related_name='productos',
                        through='Gestion_de_Productos.ProductoProveedor',
                        through_fields=('producto', 'proveedor'),
                        to='Gestion_de_Proveedores.proveedor',
                    ),
                ),
                migrations.AddConstraint(
                    model_name='productoproveedor',
                    constraint=models.UniqueConstraint(
                        fields=('producto', 'proveedor'),
                        name='producto_proveedor_unico',
                    ),
                ),
            ],
        ),
    ]
