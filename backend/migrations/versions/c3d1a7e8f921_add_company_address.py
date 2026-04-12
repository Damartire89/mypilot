"""add_company_address

Revision ID: c3d1a7e8f921
Revises: ba6e2dc4f065
Create Date: 2026-04-11 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c3d1a7e8f921'
down_revision: Union[str, None] = 'ba6e2dc4f065'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('address', sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'address')
