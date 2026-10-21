import {
  Progress as ProgressPrimitive,
  Slider as SliderPrimitive,
} from 'radix-ui'
import { cn } from '@/lib/utils'

/*
 * Van sobre los primitivos de Radix y no sobre los `progress` y `slider` de
 * shadcn a propósito. El `Progress` generado se queda el `value` sin pasárselo
 * a Radix, y la barra se anuncia sin valor. Al tirador del `Slider` generado no
 * le llega ningún nombre, y un lector de pantalla lo lee como un control
 * anónimo. Arreglarlos sería editar `components/ui/` a mano.
 */

type TaskProgressBarProps = {
  value: number
  /** Qué mide la barra, para quien no la ve: el título de la tarea. */
  label: string
  className?: string
}

/**
 * El avance de una tarea, de solo lectura. El porcentaje va escrito al lado
 * además de dibujado: una barra casi vacía y una vacía del todo se distinguen
 * mal a simple vista, y `0 %` también es un dato.
 */
export function TaskProgressBar({
  value,
  label,
  className,
}: TaskProgressBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ProgressPrimitive.Root
        value={value}
        max={100}
        aria-label={`Avance de «${label}»`}
        className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full"
      >
        <ProgressPrimitive.Indicator
          className="bg-primary h-full w-full transition-transform"
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
      <span
        className="text-muted-foreground w-10 shrink-0 text-right text-xs tabular-nums"
        aria-hidden="true"
      >
        {value} %
      </span>
    </div>
  )
}

type TaskProgressSliderProps = {
  value: number
  label: string
  disabled?: boolean
  /** Mientras se arrastra: solo pinta. */
  onChange: (value: number) => void
  /** Al soltar o con cada pulsación de teclado: es lo que se guarda. */
  onCommit: (value: number) => void
}

/**
 * El control para fijar el avance. Va de cinco en cinco: nadie distingue en
 * una barra un 42 % de un 43 %, y con pasos de uno el teclado necesitaría cien
 * pulsaciones para recorrerla. Inicio y Fin llevan a los extremos.
 */
export function TaskProgressSlider({
  value,
  label,
  disabled,
  onChange,
  onCommit,
}: TaskProgressSliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={0}
      max={100}
      step={5}
      disabled={disabled}
      onValueChange={([next]) => onChange(next)}
      onValueCommit={([next]) => onCommit(next)}
      className="relative flex w-full touch-none items-center py-2 select-none data-[disabled]:opacity-50"
    >
      <SliderPrimitive.Track className="bg-muted relative h-1.5 grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-valuetext={`${value} %`}
        className="border-primary bg-background ring-ring/50 block size-4 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden"
      />
    </SliderPrimitive.Root>
  )
}
