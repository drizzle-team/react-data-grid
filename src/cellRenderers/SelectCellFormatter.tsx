import type { RenderCheckboxProps } from '../types';
import { useDefaultRenderers } from '../DataGridDefaultRenderersProvider';

type SharedInputProps = Pick<
  RenderCheckboxProps,
  'disabled' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'indeterminate' | 'onChange'
>;

interface SelectCellFormatterProps extends SharedInputProps {
  value: boolean;
  rowIdx: number;
}

export function SelectCellFormatter({
  value,
  tabIndex,
  rowIdx,
  indeterminate,
  disabled,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: SelectCellFormatterProps) {
  const renderCheckbox = useDefaultRenderers()!.renderCheckbox!;

  return renderCheckbox({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    tabIndex,
    indeterminate,
    disabled,
    rowIdx,
    checked: value,
    onChange
  });
}
